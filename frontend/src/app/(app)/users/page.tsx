import { requireCompanyAccount, getCompanyUsers } from "./actions";
import UsersPageClient from "./users-page-client";

export default async function UsersPage() {
  await requireCompanyAccount();
  const users = await getCompanyUsers();
  return <UsersPageClient initialUsers={users} user={null} />;
}


