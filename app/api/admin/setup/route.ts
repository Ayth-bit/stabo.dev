import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Only allow creation of admin@example.com user
    if (email !== 'admin@example.com') {
      return NextResponse.json(
        { error: 'Only admin@example.com can be created through this endpoint' },
        { status: 400 }
      );
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    // Check if admin user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUser.users.some((user) => user.email === email);

    if (adminExists) {
      return NextResponse.json({ message: 'Admin user already exists' }, { status: 200 });
    }

    // Create admin user using Supabase Admin API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation for admin
      user_metadata: {
        display_name: 'Administrator',
      },
    });

    if (createError) {
      console.error('Failed to create admin user:', createError);
      return NextResponse.json(
        { error: `Failed to create admin user: ${createError.message}` },
        { status: 500 }
      );
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: 'User creation failed - no user data returned' },
        { status: 500 }
      );
    }

    // Create or update users_extended record
    const { error: extendedError } = await supabaseAdmin.from('users_extended').upsert({
      id: userData.user.id,
      display_name: 'Administrator',
      is_creator: true,
      is_admin: true,
      qr_code: `admin_qr_${userData.user.id.slice(0, 8)}`,
      points: 1000,
      notification_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (extendedError) {
      console.error('Failed to create users_extended record:', extendedError);
      return NextResponse.json(
        { error: `Failed to create user profile: ${extendedError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: userData.user.id,
        email: userData.user.email,
      },
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET method to check admin status
export async function GET() {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    // Check if admin user exists
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = users.users.find((user) => user.email === 'admin@example.com');

    if (!adminUser) {
      return NextResponse.json({
        exists: false,
        message: 'Admin user not found',
      });
    }

    // Check if users_extended record exists
    const { data: extendedData } = await supabaseAdmin
      .from('users_extended')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    return NextResponse.json({
      exists: true,
      hasProfile: !!extendedData,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        created_at: adminUser.created_at,
      },
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 });
  }
}
