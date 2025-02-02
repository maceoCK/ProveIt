"use client";

import { useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

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
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user metadata
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
    <div className="container mx-auto py-8 max-w-2xl bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
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
          {avatarUrl && (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-24 h-24 rounded-full mt-2"
            />
          )}
        </div>
        <div className="bg-background text-foreground">
          <Label>Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-background text-foreground"
          />
        </div>
        <Button onClick={handleProfileUpdate}>Save Changes</Button>
      </div>
    </div>
  );
} 