from __future__ import annotations

from datetime import datetime
from textwrap import wrap
from typing import Any, Mapping


PAGE_WIDTH = 612
PAGE_HEIGHT = 792
LEFT_MARGIN = 50
TOP_Y = 760
LINE_HEIGHT = 14
LINES_PER_PAGE = 50
MAX_LINE_CHARS = 88


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).replace("\r\n", "\n").replace("\r", "\n")


def _pdf_escape(value: str) -> str:
    value = value.encode("latin-1", errors="replace").decode("latin-1")
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _append_wrapped(lines: list[str], text: Any = "", *, indent: int = 0) -> None:
    prefix = " " * indent
    raw_text = _clean_text(text)
    if not raw_text:
        lines.append("")
        return

    width = max(20, MAX_LINE_CHARS - indent)
    for paragraph in raw_text.split("\n"):
        if not paragraph.strip():
            lines.append("")
            continue
        wrapped = wrap(paragraph, width=width, replace_whitespace=False)
        if not wrapped:
            lines.append(prefix)
            continue
        lines.extend(f"{prefix}{line}" for line in wrapped)


def _report_lines(contract: Mapping[str, Any]) -> list[str]:
    clauses = contract.get("clauses") or []
    if not isinstance(clauses, list):
        clauses = []

    lines: list[str] = []
    _append_wrapped(lines, "LexiGuard Contract Analysis Report")
    _append_wrapped(lines, f"Generated UTC: {datetime.utcnow().isoformat(timespec='seconds')}Z")
    _append_wrapped(lines, f"Contract: {_clean_text(contract.get('name') or 'Untitled')}")
    _append_wrapped(lines, f"Client: {_clean_text(contract.get('client') or 'Unknown')}")
    _append_wrapped(lines, f"Risk Level: {_clean_text(contract.get('risk_level') or 'Unclassified')}")
    _append_wrapped(lines, f"Review Status: {_clean_text(contract.get('status') or 'Unknown')}")
    _append_wrapped(lines, f"Analyzed At: {_clean_text(contract.get('analyzed_at') or 'Not recorded')}")
    _append_wrapped(lines, f"Total Clauses: {contract.get('total_clauses') or len(clauses)}")
    _append_wrapped(lines)

    _append_wrapped(lines, "Executive Summary")
    _append_wrapped(lines, contract.get("summary") or "No executive summary returned by analysis service.")
    _append_wrapped(lines)

    _append_wrapped(lines, "Clause Analysis")
    if not clauses:
        _append_wrapped(lines, "No clauses returned by analysis service.")
    for index, clause in enumerate(clauses, start=1):
        if not isinstance(clause, Mapping):
            continue
        title = clause.get("title") or f"Clause {index}"
        category = clause.get("category") or "Uncategorized"
        confidence = clause.get("confidence")
        _append_wrapped(lines, f"{index}. {title}")
        _append_wrapped(lines, f"Category: {category}", indent=2)
        if confidence is not None:
            _append_wrapped(lines, f"Confidence: {confidence}", indent=2)
        _append_wrapped(lines, "Summary:", indent=2)
        _append_wrapped(lines, clause.get("summary") or "No summary returned.", indent=4)
        _append_wrapped(lines, "Text:", indent=2)
        _append_wrapped(lines, clause.get("text") or "No clause text returned.", indent=4)
        _append_wrapped(lines)

    return lines


def _paginate(lines: list[str]) -> list[list[str]]:
    return [lines[index : index + LINES_PER_PAGE] for index in range(0, len(lines), LINES_PER_PAGE)] or [[]]


def build_contract_report_pdf(contract: Mapping[str, Any]) -> bytes:
    pages = _paginate(_report_lines(contract))

    objects: list[bytes] = []

    def add_object(payload: bytes) -> int:
        objects.append(payload)
        return len(objects)

    catalog_id = add_object(b"<< /Type /Catalog /Pages 2 0 R >>")
    pages_id = add_object(b"")
    font_id = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    page_ids: list[int] = []
    for page_number, page_lines in enumerate(pages, start=1):
        content_lines = [
            "BT",
            f"/F1 10 Tf",
            f"{LEFT_MARGIN} {TOP_Y} Td",
            f"{LINE_HEIGHT} TL",
        ]
        for line in page_lines:
            content_lines.append(f"({_pdf_escape(line)}) Tj")
            content_lines.append("T*")
        content_lines.append(f"(Page {page_number} of {len(pages)}) Tj")
        content_lines.append("ET")
        content = "\n".join(content_lines).encode("latin-1", errors="replace")
        content_id = add_object(
            b"<< /Length "
            + str(len(content)).encode("ascii")
            + b" >>\nstream\n"
            + content
            + b"\nendstream"
        )
        page_id = add_object(
            (
                f"<< /Type /Page /Parent {pages_id} 0 R "
                f"/MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
                f"/Resources << /Font << /F1 {font_id} 0 R >> >> "
                f"/Contents {content_id} 0 R >>"
            ).encode("ascii")
        )
        page_ids.append(page_id)

    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode("ascii")

    chunks = [b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"]
    offsets: list[int] = [0]
    for object_id, payload in enumerate(objects, start=1):
        offsets.append(sum(len(chunk) for chunk in chunks))
        chunks.append(f"{object_id} 0 obj\n".encode("ascii"))
        chunks.append(payload)
        chunks.append(b"\nendobj\n")

    xref_offset = sum(len(chunk) for chunk in chunks)
    chunks.append(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    chunks.append(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        chunks.append(f"{offset:010d} 00000 n \n".encode("ascii"))
    chunks.append(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        ).encode("ascii")
    )

    return b"".join(chunks)
