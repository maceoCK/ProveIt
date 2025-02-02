"use client";

import Link from "next/link";
import { PanelLeft, ListTodo, User, Info } from "lucide-react";
import { SidebarHeader, SidebarMenuButton } from "@/components/ui/sidebar";

export function SidebarContent({
  pathname,
  selectedGroup,
  groupsState,
  user
}: {
  pathname: string;
  selectedGroup: string | null;
  groupsState: any[];
  user: any;
}) {
  return (
    <>
      <SidebarHeader className="pb-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold px-2">
          <ListTodo className="h-6 w-6" />
          <span>ProveIt</span>
        </Link>
      </SidebarHeader>

      <div className="flex-1 space-y-1">
        <SidebarMenuButton asChild>
          <Link href="/" className="gap-3">
            <PanelLeft className="h-4 w-4" />
            <span className={pathname === "/" ? "border-b-2 border-primary" : ""}>
              To Do List
            </span>
          </Link>
        </SidebarMenuButton>

        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link
              href="/"
              className="flex items-center px-2 py-1.5 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            >
              <span className={(!selectedGroup && pathname === "/") ? "border-b-2 border-primary" : ""}>
                All Tasks
              </span>
            </Link>
            {groupsState.map((group) => (
              <Link
                key={group.id}
                href={`/?group=${group.id}`}
                className="flex items-center px-2 py-1.5 text-sm font-medium hover:bg-accent rounded-md transition-colors"
              >
                <span className={
                  selectedGroup === group.id.toString() && pathname === "/" 
                    ? "border-b-2 border-primary" 
                    : ""
                }>
                  {group.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <SidebarMenuButton asChild>
          <Link href="/about" className="gap-3">
            <Info className="h-4 w-4" />
            <span className={pathname === "/about" ? "border-b-2 border-primary" : ""}>
              About
            </span>
          </Link>
        </SidebarMenuButton>

        {user?.email === 'maceo.ck@gmail.com' && (
          <SidebarMenuButton asChild>
            <Link href="/admin" className="gap-3">
              <User className="h-4 w-4" />
              <span className={pathname === "/admin" ? "border-b-2 border-primary" : ""}>
                Admin Panel
              </span>
            </Link>
          </SidebarMenuButton>
        )}
      </div>
    </>
  );
} 