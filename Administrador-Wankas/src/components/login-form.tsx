"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@(gmail\.com|outlook\.com|hotmail\.com|yahoo\.com|wanka\.com)$/i;
    return emailRegex.test(email);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Correo inválido",
        description: "Por favor, utiliza un correo con un dominio válido (ej. gmail, outlook, etc.).",
      });
      return;
    }

    const { error } = await login(email, password);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error.message,
      });
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <form onSubmit={handleLogin}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>Ingrese sus credenciales para acceder.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="admin@wanka.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
            Ingresar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
