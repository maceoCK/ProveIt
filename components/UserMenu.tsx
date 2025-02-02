import { useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User } from "lucide-react";

export default function UserMenu() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata.username || '');
      setAvatarUrl(user.user_metadata.avatar_url || '');
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { 
        username,
        avatar_url: avatarUrl
      }
    });

    if (error) {
      alert('Error updating profile');
    } else {
      alert('Profile updated!');
      setOpen(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (error) throw error;
      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div>
            <Label>Avatar</Label>
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
              disabled={uploading}
            />
          </div>
          <div>
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center">
            <Button onClick={handleProfileUpdate}>Update Profile</Button>
            <Button 
              variant="ghost" 
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 