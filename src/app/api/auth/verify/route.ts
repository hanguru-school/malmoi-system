import { NextRequest, NextResponse } from 'next/server';
import { cognitoService } from '@/lib/aws-cognito';
import { databaseService } from '@/lib/aws-rds';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Verify with Cognito
    const cognitoUser = await cognitoService.verifyToken(token);
    
    // Get user from database
    const user = await databaseService.getUserByEmail(decoded.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        cognitoUserId: user.cognito_user_id
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
} 