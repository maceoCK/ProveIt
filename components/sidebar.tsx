"use client";

import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {  LogOut, User } from "lucide-react";

export function SidebarNav({ 
  children,
  user,
  toggleTheme,
  handleSignOut,
  theme
}: {
  children: React.ReactNode;
  user: any;
  toggleTheme: () => void;
  handleSignOut: () => void;
  theme: string | undefined;
}) {
  return (
    <Sidebar className="border-r w-[250px]">
      <SidebarContent>
        {children}
        
        <SidebarFooter className="pt-4">
          <SidebarSeparator className="mb-4" />
          <div className="space-y-2">
            <SidebarMenuButton onClick={toggleTheme}>
              Toggle Theme
            </SidebarMenuButton>

            {user && (
              <>
                <SidebarMenuButton className="justify-between">
                  <div className="flex items-center gap-3">
                    {user.user_metadata.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        className="w-6 h-6 rounded-full"
                        alt="Profile"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="truncate">
                      {user.user_metadata.username || user.email}
                    </span>
                  </div>
                </SidebarMenuButton>

                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </SidebarMenuButton>
              </>
            )}
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}