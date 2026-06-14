'use server';

import { createAdminClient } from '@/lib/supabase/adminClient';
import { revalidatePath } from 'next/cache';

interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function createUserAction(formData: {
  name: string;
  email: string;
  role: string;
  password?: string;
}): Promise<ActionResponse> {
  try {
    const { name, email, role, password } = formData;

    if (!name || !email || !role || !password) {
      return { success: false, error: 'Por favor, rellene todos los campos requeridos.' };
    }

    const adminClient = createAdminClient();

    // Create user in auth.users
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return { success: false, error: authError.message };
    }

    // Since the database trigger on_auth_user_created automatically copies the user to public.profiles,
    // we don't need to insert into profiles manually! 
    // However, the trigger might not run if it's disabled. We can verify or just let it run.
    // Let's revalidate paths
    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (err: any) {
    console.error('Create user exception:', err);
    return { success: false, error: err.message || 'Error interno del servidor.' };
  }
}

export async function updateUserAction(
  userId: string,
  formData: {
    name: string;
    email: string;
    role: string;
    password?: string;
  }
): Promise<ActionResponse> {
  try {
    const { name, email, role, password } = formData;

    if (!name || !email || !role) {
      return { success: false, error: 'Por favor, rellene todos los campos requeridos.' };
    }

    const adminClient = createAdminClient();

    // 1. Update auth.users details (email, password if provided, metadata)
    const updateData: any = {
      email,
      user_metadata: {
        name,
        role,
      },
    };

    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, updateData);

    if (authError) {
      console.error('Error updating auth user:', authError);
      return { success: false, error: authError.message };
    }

    // 2. Also update public.profiles (since trigger on_auth_user_created only runs on INSERT)
    const { error: dbError } = await adminClient
      .from('profiles')
      .update({
        name,
        email,
        role,
      })
      .eq('id', userId);

    if (dbError) {
      console.error('Error updating public profile:', dbError);
      return { success: false, error: dbError.message };
    }

    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (err: any) {
    console.error('Update user exception:', err);
    return { success: false, error: err.message || 'Error interno del servidor.' };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'ID de usuario inválido.' };
    }

    const adminClient = createAdminClient();

    // Delete user from auth.users (foreign key with ON DELETE CASCADE will auto-delete public.profiles)
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return { success: false, error: authError.message };
    }

    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (err: any) {
    console.error('Delete user exception:', err);
    return { success: false, error: err.message || 'Error interno del servidor.' };
  }
}
