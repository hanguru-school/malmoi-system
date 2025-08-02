/**
 * 통계 및 분석 엔진
 * 학생 학습 데이터, 예약 이력, 숙제 이력, 출석 정보, 리뷰 기록 등을 분석
 */

export interface AnalyticsData {
  // 기본 통계
  totalBookings: number;
  totalCancellations: number;
  sameDayCancellations: number;
  missedClasses: number;
  completedClasses: number;
  averageClassDuration: number;

  // 선생님별 통계
  teacherStats: {
    [teacherId: string]: {
      totalClasses: number;
      averageRating: number;
      studentCount: number;
      completionRate: number;
    };
  };

  // 학생별 통계
  studentStats: {
    [studentId: string]: {
      totalHours: number;
      averageBookingInterval: number;
      lastClassDays: number;
      attendanceRate: number;
      homeworkCompletionRate: number;
      preferredDays: string[];
      preferredTimes: string[];
    };
  };

  // 숙제 통계
  homeworkStats: {
    totalAssigned: number;
    totalCompleted: number;
    averageAccuracy: number;
    errorTypeStats: {
      [errorType: string]: number;
    };
  };

  // 레벨별 통계
  levelStats: {
    [level: string]: {
      studentCount: number;
      averageProgressTime: number;
      completionRate: number;
    };
  };

  // 시간대별 통계
  timeAnalysis: {
    weekdayDistribution: { [day: string]: number };
    hourlyDistribution: { [hour: string]: number };
    seasonalTrends: { [month: string]: number };
  };

  // 리뷰 통계
  reviewStats: {
    totalReviews: number;
    averageRating: number;
    immediateReviews: number;
    delayedReviews: number;
  };

  // 알림 반응 통계
  notificationStats: {
    totalSent: number;
    responseRate: number;
    bookingIncreaseRate: number;
  };
}

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  teacherIds?: string[];
  studentIds?: string[];
  levels?: string[];
  classTypes?: string[];
}

class AnalyticsEngine {
  private data: AnalyticsData | null = null;
  private cache: Map<string, any> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5분

  /**
   * 전체 분석 데이터 생성
   */
  async generateAnalytics(filter?: AnalyticsFilter): Promise<AnalyticsData> {
    const cacheKey = this.generateCacheKey(filter);

    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      // 실제 데이터 분석 수행
      const analyticsData = await this.performAnalysis(filter);

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: analyticsData,
        timestamp: Date.now(),
      });

      this.data = analyticsData;
      return analyticsData;
    } catch (error) {
      console.error("Analytics generation failed:", error);
      throw new Error("통계 데이터 생성에 실패했습니다.");
    }
  }

  /**
   * 실제 분석 수행
   */
  private async performAnalysis(
    filter?: AnalyticsFilter,
  ): Promise<AnalyticsData> {
    // 여기서는 더미 데이터를 사용하지만, 실제로는 DB에서 데이터를 가져와야 함
    const mockData: AnalyticsData = {
      totalBookings: 1250,
      totalCancellations: 89,
      sameDayCancellations: 23,
      missedClasses: 15,
      completedClasses: 1147,
      averageClassDuration: 45,

      teacherStats: {
        teacher1: {
          totalClasses: 320,
          averageRating: 4.8,
          studentCount: 45,
          completionRate: 0.95,
        },
        teacher2: {
          totalClasses: 280,
          averageRating: 4.6,
          studentCount: 38,
          completionRate: 0.92,
        },
      },

      studentStats: {
        student1: {
          totalHours: 120,
          averageBookingInterval: 3.2,
          lastClassDays: 2,
          attendanceRate: 0.98,
          homeworkCompletionRate: 0.85,
          preferredDays: ["월", "수", "금"],
          preferredTimes: ["18:00", "19:00", "20:00"],
        },
      },

      homeworkStats: {
        totalAssigned: 850,
        totalCompleted: 720,
        averageAccuracy: 0.78,
        errorTypeStats: {
          문법: 45,
          어휘: 32,
          발음: 28,
          회화: 15,
        },
      },

      levelStats: {
        초급: {
          studentCount: 25,
          averageProgressTime: 3.5,
          completionRate: 0.88,
        },
        중급: {
          studentCount: 35,
          averageProgressTime: 4.2,
          completionRate: 0.92,
        },
        고급: {
          studentCount: 20,
          averageProgressTime: 5.1,
          completionRate: 0.95,
        },
      },

      timeAnalysis: {
        weekdayDistribution: {
          월: 180,
          화: 165,
          수: 190,
          목: 175,
          금: 200,
          토: 150,
          일: 90,
        },
        hourlyDistribution: {
          "09:00": 45,
          "10:00": 60,
          "11:00": 55,
          "14:00": 70,
          "15:00": 85,
          "16:00": 95,
          "17:00": 110,
          "18:00": 125,
          "19:00": 130,
          "20:00": 115,
          "21:00": 90,
        },
        seasonalTrends: {
          "1월": 85,
          "2월": 78,
          "3월": 92,
          "4월": 88,
          "5월": 95,
          "6월": 82,
          "7월": 75,
          "8월": 68,
          "9월": 88,
          "10월": 92,
          "11월": 95,
          "12월": 87,
        },
      },

      reviewStats: {
        totalReviews: 890,
        averageRating: 4.7,
        immediateReviews: 650,
        delayedReviews: 240,
      },

      notificationStats: {
        totalSent: 1250,
        responseRate: 0.68,
        bookingIncreaseRate: 0.25,
      },
    };

    return mockData;
  }

  /**
   * 휴면 학생 식별
   */
  async identifyDormantStudents(daysThreshold: number = 30): Promise<string[]> {
    if (!this.data) {
      await this.generateAnalytics();
    }

    const dormantStudents: string[] = [];

    for (const [studentId, stats] of Object.entries(this.data!.studentStats)) {
      if (stats.lastClassDays > daysThreshold) {
        dormantStudents.push(studentId);
      }
    }

    return dormantStudents;
  }

  /**
   * 오답률 높은 숙제 식별
   */
  async identifyProblematicHomework(
    threshold: number = 0.3,
  ): Promise<string[]> {
    if (!this.data) {
      await this.generateAnalytics();
    }

    // 실제로는 숙제별 오답률을 계산해야 함
    const problematicHomework: string[] = [];

    // 더미 데이터
    const homeworkErrorRates = {
      homework1: 0.45,
      homework2: 0.28,
      homework3: 0.35,
      homework4: 0.22,
    };

    for (const [homeworkId, errorRate] of Object.entries(homeworkErrorRates)) {
      if (errorRate > threshold) {
        problematicHomework.push(homeworkId);
      }
    }

    return problematicHomework;
  }

  /**
   * 선생님별 수업 패턴 분석
   */
  async analyzeTeacherPatterns(teacherId: string): Promise<any> {
    if (!this.data) {
      await this.generateAnalytics();
    }

    const teacherStats = this.data!.teacherStats[teacherId];
    if (!teacherStats) {
      throw new Error("선생님 정보를 찾을 수 없습니다.");
    }

    return {
      ...teacherStats,
      patterns: {
        preferredTimeSlots: ["18:00", "19:00", "20:00"],
        averageClassDuration: 45,
        studentRetentionRate: 0.92,
        commonTopics: ["문법", "회화", "어휘"],
      },
    };
  }

  /**
   * 학생별 학습 경향 분석
   */
  async analyzeStudentTrends(studentId: string): Promise<any> {
    if (!this.data) {
      await this.generateAnalytics();
    }

    const studentStats = this.data!.studentStats[studentId];
    if (!studentStats) {
      throw new Error("학생 정보를 찾을 수 없습니다.");
    }

    return {
      ...studentStats,
      trends: {
        progressRate: 0.85,
        strengthAreas: ["회화", "어휘"],
        weakAreas: ["문법", "발음"],
        recommendedActions: [
          "문법 복습 강화",
          "발음 연습 시간 증가",
          "회화 연습 지속",
        ],
      },
    };
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(filter?: AnalyticsFilter): string {
    if (!filter) return "default";

    return JSON.stringify({
      startDate: filter.startDate?.toISOString(),
      endDate: filter.endDate?.toISOString(),
      teacherIds: filter.teacherIds?.sort(),
      studentIds: filter.studentIds?.sort(),
      levels: filter.levels?.sort(),
      classTypes: filter.classTypes?.sort(),
    });
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 특정 통계만 가져오기
   */
  async getSpecificStats(
    type: "bookings" | "homework" | "reviews" | "attendance",
    filter?: AnalyticsFilter,
  ): Promise<any> {
    const fullData = await this.generateAnalytics(filter);

    switch (type) {
      case "bookings":
        return {
          totalBookings: fullData.totalBookings,
          totalCancellations: fullData.totalCancellations,
          sameDayCancellations: fullData.sameDayCancellations,
          completedClasses: fullData.completedClasses,
          averageClassDuration: fullData.averageClassDuration,
        };
      case "homework":
        return fullData.homeworkStats;
      case "reviews":
        return fullData.reviewStats;
      case "attendance":
        return {
          totalStudents: Object.keys(fullData.studentStats).length,
          averageAttendanceRate:
            Object.values(fullData.studentStats).reduce(
              (sum, stats) => sum + stats.attendanceRate,
              0,
            ) / Object.keys(fullData.studentStats).length,
        };
      default:
        throw new Error("지원하지 않는 통계 유형입니다.");
    }
  }
}

// 싱글톤 인스턴스
export const analyticsEngine = new AnalyticsEngine();

/**
 * 차트 데이터 변환 유틸리티
 */
export class ChartDataConverter {
  /**
   * 파이 차트 데이터로 변환
   */
  static toPieChartData(
    data: Record<string, unknown>,
    labelKey: string,
    valueKey: string,
  ) {
    return Object.entries(data).map(([key, value]) => ({
      label: key,
      value: typeof value === 'object' && value !== null && valueKey in value 
        ? (value as Record<string, unknown>)[valueKey] 
        : value,
    }));
  }

  /**
   * 바 차트 데이터로 변환
   */
  static toBarChartData(
    data: Record<string, unknown>,
    labelKey: string,
    valueKey: string,
  ) {
    return Object.entries(data).map(([key, value]) => ({
      label: key,
      value: typeof value === 'object' && value !== null && valueKey in value 
        ? (value as Record<string, unknown>)[valueKey] 
        : value,
    }));
  }

  /**
   * 선 그래프 데이터로 변환
   */
  static toLineChartData(
    data: Record<string, unknown>,
    labelKey: string,
    valueKey: string,
  ) {
    return Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        label: key,
        value: typeof value === 'object' && value !== null && valueKey in value 
          ? (value as Record<string, unknown>)[valueKey] 
          : value,
      }));
  }

  /**
   * 히트맵 데이터로 변환
   */
  static toHeatmapData(data: Record<string, unknown>) {
    const heatmapData: Record<string, unknown>[] = [];

    for (const [day, hours] of Object.entries(data)) {
      if (typeof hours === 'object' && hours !== null) {
        for (const [hour, value] of Object.entries(hours as Record<string, unknown>)) {
          heatmapData.push({
            day,
            hour,
            value,
          });
        }
      }
    }

    return heatmapData;
  }
}
