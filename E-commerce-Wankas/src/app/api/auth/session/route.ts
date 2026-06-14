import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionStore } from '@/lib/redis';
import crypto from 'crypto';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get('wankas_sid')?.value;
    if (!sid) {
      return NextResponse.json({ session: null });
    }
    const sessionStr = await sessionStore.get(`session:${sid}`);
    if (!sessionStr) {
      return NextResponse.json({ session: null });
    }
    return NextResponse.json({ session: JSON.parse(sessionStr) });
  } catch (error: any) {
    console.error('Error fetching session from store:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { session } = await request.json();
    if (!session || !session.access_token) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const cookieStore = await cookies();
    let sid = cookieStore.get('wankas_sid')?.value;
    if (!sid) {
      sid = crypto.randomUUID();
    }

    const duration = session.expires_at 
      ? Math.max(0, session.expires_at - Math.floor(Date.now() / 1000))
      : 7 * 24 * 60 * 60; // 7 days fallback

    // Store session in Redis
    await sessionStore.set(`session:${sid}`, JSON.stringify(session), 'EX', duration);

    // Set cookie
    cookieStore.set('wankas_sid', sid, {
      path: '/',
      maxAge: duration,
      httpOnly: false, // Let client js know we have a session
      sameSite: 'lax',
      secure: false, // development localhost
    });

    return NextResponse.json({ success: true, sid });
  } catch (error: any) {
    console.error('Error saving session to store:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get('wankas_sid')?.value;
    if (sid) {
      await sessionStore.del(`session:${sid}`);
    }

    // Clear cookie
    cookieStore.set('wankas_sid', '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: false,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting session from store:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
