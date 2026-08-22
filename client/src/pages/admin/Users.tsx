import { Redirect } from "wouter";

/** Kept for old bookmarks — accounts live under Databases now. */
export default function AdminUsers() {
  return <Redirect to="/admin/databases" />;
}
