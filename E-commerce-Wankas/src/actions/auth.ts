'use server';

import { supabase } from '@/lib/supabaseClient';
import type { User } from '@/types';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const allowedDomains = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'aol.com',
];

const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z
    .string()
    .email({ message: 'Por favor, introduce una dirección de correo válida.' })
    .refine(email => {
        const domain = email.split('@')[1];
        return allowedDomains.includes(domain);
    }, {
        message: 'Por favor, utiliza un proveedor de correo electrónico válido (ej: Gmail, Outlook).'
    }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

const LoginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Por favor, introduce una dirección de correo válida.' })
    .refine(email => {
        const domain = email.split('@')[1];
        return allowedDomains.includes(domain);
    }, {
        message: 'Por favor, utiliza un proveedor de correo electrónico válido (ej: Gmail, Outlook).'
    }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }),
});


interface ActionResult {
  error?: string;
  user?: User;
}

export async function registerUser(values: z.infer<typeof RegisterSchema>): Promise<ActionResult> {
  const validatedFields = RegisterSchema.safeParse(values);
  if (!validatedFields.success) {
    const firstError = validatedFields.error.errors[0].message;
    return { error: firstError || 'Campos inválidos.' };
  }

  const { name, email, password } = validatedFields.data;

  if (!supabase) {
    return { error: 'El servicio de base de datos no está disponible.' };
  }

  const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (existingUser) {
    return { error: 'Ya existe una cuenta con este correo electrónico.' };
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const generatedUserId = crypto.randomUUID();

  const { data: insertedProfile, error: insertError } = await supabase
    .from('profiles')
    .insert([
      { 
        id: generatedUserId, 
        name, 
        email, 
        password_hash: hashedPassword 
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error('Error de inserción en Supabase:', insertError);
    return { error: 'No se pudo crear la cuenta. Por favor, inténtalo de nuevo.' };
  }

  if (insertedProfile) {
    const newUser: User = {
      id: insertedProfile.id,
      email: insertedProfile.email,
      name: insertedProfile.name,
      phone_number: insertedProfile.phone_number,
    };
    return { user: newUser };
  }

  return { error: 'No se pudo crear la cuenta.' };
}


export async function loginUser(values: z.infer<typeof LoginSchema>): Promise<ActionResult> {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
      const firstError = validatedFields.error.errors[0].message;
      return { error: firstError || 'Correo electrónico o contraseña inválidos.' };
  }
  
  const { email, password } = validatedFields.data;

  if (!supabase) {
    return { error: 'El servicio de base de datos no está disponible.' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone_number, password_hash')
    .eq('email', email)
    .single();

  if (error || !profile) {
    return { error: 'Correo electrónico o contraseña inválidos.' };
  }

  if (!profile.password_hash) {
      return { error: 'Esta cuenta antigua no tiene contraseña. Contacta a soporte o crea una cuenta nueva.' };
  }

  const passwordsMatch = await bcrypt.compare(password, profile.password_hash);

  if (!passwordsMatch) {
    return { error: 'Correo electrónico o contraseña inválidos.' };
  }

  const user: User = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    phone_number: profile.phone_number,
  };

  return { user };
}
