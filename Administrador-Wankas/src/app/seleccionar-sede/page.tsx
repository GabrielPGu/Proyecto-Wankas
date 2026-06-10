
"use client"

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


export default function SelectLocationPage() {
    const { user, updateUser, loading } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [locations, setLocations] = React.useState<Location[]>([]);
    const [selectedLocationId, setSelectedLocationId] = React.useState<string>('');
    const [isFetching, setIsFetching] = React.useState(true);

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/');
            } else if (user.role !== 'worker') {
                router.replace('/dashboard');
            } else if (user.location_id) {
                router.replace('/dashboard/pedidos');
            }
        }
    }, [user, loading, router]);
    
    React.useEffect(() => {
        const fetchLocations = async () => {
            setIsFetching(true);
            const { data, error } = await supabase.from('locations').select('*').order('name_es');
            if (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las sedes.' });
            } else {
                setLocations(data);
            }
            setIsFetching(false);
        };
        if(user && user.role === 'worker' && !user.location_id) {
            fetchLocations();
        }
    }, [supabase, toast, user]);
    
    const handleContinue = () => {
        if (!selectedLocationId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona una sede.' });
            return;
        }
        const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
        if (selectedLocation) {
            updateUser({ location_id: selectedLocation.id, locationName: selectedLocation.name_es });
            router.push('/dashboard/pedidos');
        }
    };

    const isLoading = loading || isFetching;

    if (isLoading || !user || (user && user.role !== 'worker') || (user && user.location_id)) {
        return (
            <div className="flex h-screen items-center justify-center">
                 <div className="w-full max-w-md p-4 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        )
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Seleccionar Sede</CardTitle>
                    <CardDescription>Para continuar, elige la sede en la que te encuentras.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                        <Label htmlFor="location">Sede de Trabajo</Label>
                        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                            <SelectTrigger id="location">
                                <SelectValue placeholder="Elige una sede..." />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                        {loc.name_es}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleContinue} className="w-full" disabled={!selectedLocationId}>
                        Continuar al Panel
                    </Button>
                </CardFooter>
            </Card>
        </main>
    )
}
