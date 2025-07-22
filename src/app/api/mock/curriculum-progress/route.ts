import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock curriculum progress data
    const mockProgress = {
      success: true,
      data: {
        totalLessons: 50,
        completedLessons: 25,
        currentLevel: 'B-1',
        progressPercentage: 50,
        nextLesson: 'Lesson 26',
        recentActivity: [
          {
            id: '1',
            lessonTitle: 'Lesson 25',
            completedAt: new Date().toISOString(),
            score: 85,
            timeSpent: 45
          },
          {
            id: '2',
            lessonTitle: 'Lesson 24',
            completedAt: new Date(Date.now() - 86400000).toISOString(),
            score: 92,
            timeSpent: 38
          }
        ]
      }
    };

    return NextResponse.json(mockProgress);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch curriculum progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock progress update
    const mockResponse = {
      success: true,
      message: 'Progress updated successfully',
      data: {
        lessonId: body.lessonId,
        score: body.score || 85,
        timeSpent: body.timeSpent || 30,
        completedAt: new Date().toISOString()
      }
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
} 