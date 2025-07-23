export type Language = 'ko' | 'ja';

export interface Translations {
  // 공통
  common: {
    logout: string;
    confirm: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    search: string;
    loading: string;
    noData: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    open: string;
    yes: string;
    no: string;
    today: string;
    yesterday: string;
    tomorrow: string;
  };

  // 학생용
  student: {
    // 네비게이션
    navigation: {
      home: string;
      reservations: string;
      mypage: string;
      notes: string;
      homework: string;
      vocabulary: string;
      listening: string;
      writing: string;
      examPrep: string;
      materials: string;
      contact: string;
    };

    // 홈 페이지
    home: {
      welcome: string;
      todayClasses: string;
      upcomingClasses: string;
      recentNotes: string;
      homeworkDue: string;
      progress: string;
      points: string;
      level: string;
      viewAll: string;
      noClasses: string;
      noNotes: string;
      noHomework: string;
    };

    // 예약
    reservations: {
      title: string;
      newReservation: string;
      availableSlots: string;
      selectedDate: string;
      selectedTime: string;
      teacher: string;
      course: string;
      confirm: string;
      cancel: string;
      completed: string;
      cancelled: string;
      pending: string;
    };

    // 레슨노트
    notes: {
      title: string;
      lessonDate: string;
      teacher: string;
      content: string;
      feedback: string;
      attachments: string;
      noNotes: string;
    };

    // 숙제
    homework: {
      title: string;
      dueDate: string;
      status: string;
      submitted: string;
      pending: string;
      overdue: string;
      noHomework: string;
    };

    // 문의
    contact: {
      title: string;
      sendMessage: string;
      subject: string;
      message: string;
      send: string;
      sent: string;
      error: string;
    };
  };

  // 학부모용
  parent: {
    // 네비게이션
    navigation: {
      dashboard: string;
      children: string;
      schedule: string;
      payments: string;
      reviews: string;
      reports: string;
      messages: string;
      settings: string;
    };

    // 대시보드
    dashboard: {
      welcome: string;
      childrenOverview: string;
      recentActivities: string;
      upcomingClasses: string;
      paymentStatus: string;
      teacherReviews: string;
      learningProgress: string;
      viewDetails: string;
      noActivities: string;
      noClasses: string;
      noPayments: string;
      noReviews: string;
    };

    // 자녀 관리
    children: {
      title: string;
      childInfo: string;
      name: string;
      age: string;
      grade: string;
      teacher: string;
      level: string;
      progress: string;
      lastClass: string;
      nextClass: string;
      noChildren: string;
    };

    // 수업 일정
    schedule: {
      title: string;
      thisWeek: string;
      nextWeek: string;
      classTime: string;
      teacher: string;
      course: string;
      status: string;
      completed: string;
      scheduled: string;
      cancelled: string;
      noClasses: string;
    };

    // 결제 내역
    payments: {
      title: string;
      paymentDate: string;
      amount: string;
      method: string;
      status: string;
      description: string;
      paid: string;
      pending: string;
      failed: string;
      refunded: string;
      noPayments: string;
    };

    // 선생님 리뷰
    reviews: {
      title: string;
      teacher: string;
      rating: string;
      comment: string;
      date: string;
      course: string;
      noReviews: string;
      writeReview: string;
      submit: string;
    };

    // 학습 리포트
    reports: {
      title: string;
      academicProgress: string;
      attendance: string;
      homework: string;
      participation: string;
      improvement: string;
      recommendations: string;
      period: string;
      thisMonth: string;
      lastMonth: string;
      thisYear: string;
      noData: string;
    };

    // 메시지
    messages: {
      title: string;
      compose: string;
      inbox: string;
      sent: string;
      draft: string;
      from: string;
      to: string;
      subject: string;
      message: string;
      send: string;
      reply: string;
      forward: string;
      delete: string;
      noMessages: string;
    };

    // 설정
    settings: {
      title: string;
      profile: string;
      security: string;
      notifications: string;
      privacy: string;
      billing: string;
      language: string;
      korean: string;
      japanese: string;
      saveChanges: string;
      changesSaved: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  ko: {
    common: {
      logout: '로그아웃',
      confirm: '확인',
      cancel: '취소',
      save: '저장',
      edit: '편집',
      delete: '삭제',
      search: '검색',
      loading: '로딩 중...',
      noData: '데이터가 없습니다',
      back: '뒤로',
      next: '다음',
      previous: '이전',
      close: '닫기',
      open: '열기',
      yes: '예',
      no: '아니오',
      today: '오늘',
      yesterday: '어제',
      tomorrow: '내일',
    },
    student: {
      navigation: {
        home: '홈',
        reservations: '예약',
        mypage: '마이페이지',
        notes: '레슨노트',
        homework: '숙제',
        vocabulary: '단어복습',
        listening: '듣기/녹음',
        writing: '작문테스트',
        examPrep: '시험준비',
        materials: '추가자료',
        contact: '문의하기',
      },
      home: {
        welcome: '안녕하세요!',
        todayClasses: '오늘 수업',
        upcomingClasses: '예정된 수업',
        recentNotes: '최근 레슨노트',
        homeworkDue: '마감 임박 숙제',
        progress: '진도율',
        points: '포인트',
        level: '레벨',
        viewAll: '전체보기',
        noClasses: '예정된 수업이 없습니다',
        noNotes: '레슨노트가 없습니다',
        noHomework: '숙제가 없습니다',
      },
      reservations: {
        title: '수업 예약',
        newReservation: '새 예약',
        availableSlots: '예약 가능 시간',
        selectedDate: '선택된 날짜',
        selectedTime: '선택된 시간',
        teacher: '선생님',
        course: '과정',
        confirm: '확인',
        cancel: '취소',
        completed: '완료',
        cancelled: '취소됨',
        pending: '대기 중',
      },
      notes: {
        title: '레슨노트',
        lessonDate: '수업 날짜',
        teacher: '선생님',
        content: '내용',
        feedback: '피드백',
        attachments: '첨부파일',
        noNotes: '레슨노트가 없습니다',
      },
      homework: {
        title: '숙제',
        dueDate: '마감일',
        status: '상태',
        submitted: '제출됨',
        pending: '대기 중',
        overdue: '기한 초과',
        noHomework: '숙제가 없습니다',
      },
      contact: {
        title: '문의하기',
        sendMessage: '메시지 보내기',
        subject: '제목',
        message: '메시지',
        send: '보내기',
        sent: '전송됨',
        error: '오류',
      },
    },
    parent: {
      navigation: {
        dashboard: '대시보드',
        children: '자녀 관리',
        schedule: '수업 일정',
        payments: '결제 내역',
        reviews: '선생님 리뷰',
        reports: '학습 리포트',
        messages: '메시지',
        settings: '설정',
      },
      dashboard: {
        welcome: '학부모님 환영합니다',
        childrenOverview: '자녀 현황',
        recentActivities: '최근 활동',
        upcomingClasses: '예정된 수업',
        paymentStatus: '결제 상태',
        teacherReviews: '선생님 리뷰',
        learningProgress: '학습 진도',
        viewDetails: '상세보기',
        noActivities: '활동이 없습니다',
        noClasses: '예정된 수업이 없습니다',
        noPayments: '결제 내역이 없습니다',
        noReviews: '리뷰가 없습니다',
      },
      children: {
        title: '자녀 관리',
        childInfo: '자녀 정보',
        name: '이름',
        age: '나이',
        grade: '학년',
        teacher: '담당 선생님',
        level: '레벨',
        progress: '진도율',
        lastClass: '마지막 수업',
        nextClass: '다음 수업',
        noChildren: '등록된 자녀가 없습니다',
      },
      schedule: {
        title: '수업 일정',
        thisWeek: '이번 주',
        nextWeek: '다음 주',
        classTime: '수업 시간',
        teacher: '선생님',
        course: '과정',
        status: '상태',
        completed: '완료',
        scheduled: '예정',
        cancelled: '취소',
        noClasses: '수업 일정이 없습니다',
      },
      payments: {
        title: '결제 내역',
        paymentDate: '결제일',
        amount: '금액',
        method: '결제 방법',
        status: '상태',
        description: '설명',
        paid: '결제 완료',
        pending: '대기 중',
        failed: '실패',
        refunded: '환불됨',
        noPayments: '결제 내역이 없습니다',
      },
      reviews: {
        title: '선생님 리뷰',
        teacher: '선생님',
        rating: '평점',
        comment: '코멘트',
        date: '날짜',
        course: '과정',
        noReviews: '리뷰가 없습니다',
        writeReview: '리뷰 작성',
        submit: '제출',
      },
      reports: {
        title: '학습 리포트',
        academicProgress: '학업 진도',
        attendance: '출석률',
        homework: '숙제 완료율',
        participation: '참여도',
        improvement: '향상도',
        recommendations: '권장사항',
        period: '기간',
        thisMonth: '이번 달',
        lastMonth: '지난 달',
        thisYear: '올해',
        noData: '데이터가 없습니다',
      },
      messages: {
        title: '메시지',
        compose: '작성',
        inbox: '받은 편지함',
        sent: '보낸 편지함',
        draft: '임시저장',
        from: '보낸 사람',
        to: '받는 사람',
        subject: '제목',
        message: '메시지',
        send: '보내기',
        reply: '답장',
        forward: '전달',
        delete: '삭제',
        noMessages: '메시지가 없습니다',
      },
      settings: {
        title: '설정',
        profile: '프로필',
        security: '보안',
        notifications: '알림',
        privacy: '개인정보',
        billing: '결제',
        language: '언어',
        korean: '한국어',
        japanese: '日本語',
        saveChanges: '변경사항 저장',
        changesSaved: '변경사항이 저장되었습니다',
      },
    },
  },
  ja: {
    common: {
      logout: 'ログアウト',
      confirm: '確認',
      cancel: 'キャンセル',
      save: '保存',
      edit: '編集',
      delete: '削除',
      search: '検索',
      loading: '読み込み中...',
      noData: 'データがありません',
      back: '戻る',
      next: '次へ',
      previous: '前へ',
      close: '閉じる',
      open: '開く',
      yes: 'はい',
      no: 'いいえ',
      today: '今日',
      yesterday: '昨日',
      tomorrow: '明日',
    },
    student: {
      navigation: {
        home: 'ホーム',
        reservations: '予約',
        mypage: 'マイページ',
        notes: 'レッスンノート',
        homework: '宿題',
        vocabulary: '単語復習',
        listening: 'リスニング/録音',
        writing: '作文テスト',
        examPrep: '試験準備',
        materials: '追加資料',
        contact: 'お問い合わせ',
      },
      home: {
        welcome: 'こんにちは！',
        todayClasses: '今日のレッスン',
        upcomingClasses: '予定のレッスン',
        recentNotes: '最近のレッスンノート',
        homeworkDue: '締切間近の宿題',
        progress: '進捗率',
        points: 'ポイント',
        level: 'レベル',
        viewAll: 'すべて表示',
        noClasses: '予定のレッスンがありません',
        noNotes: 'レッスンノートがありません',
        noHomework: '宿題がありません',
      },
      reservations: {
        title: 'レッスン予約',
        newReservation: '新規予約',
        availableSlots: '予約可能時間',
        selectedDate: '選択された日付',
        selectedTime: '選択された時間',
        teacher: '先生',
        course: 'コース',
        confirm: '確認',
        cancel: 'キャンセル',
        completed: '完了',
        cancelled: 'キャンセル済み',
        pending: '保留中',
      },
      notes: {
        title: 'レッスンノート',
        lessonDate: 'レッスン日',
        teacher: '先生',
        content: '内容',
        feedback: 'フィードバック',
        attachments: '添付ファイル',
        noNotes: 'レッスンノートがありません',
      },
      homework: {
        title: '宿題',
        dueDate: '締切日',
        status: '状態',
        submitted: '提出済み',
        pending: '保留中',
        overdue: '期限超過',
        noHomework: '宿題がありません',
      },
      contact: {
        title: 'お問い合わせ',
        sendMessage: 'メッセージを送信',
        subject: '件名',
        message: 'メッセージ',
        send: '送信',
        sent: '送信済み',
        error: 'エラー',
      },
    },
    parent: {
      navigation: {
        dashboard: 'ダッシュボード',
        children: 'お子様管理',
        schedule: 'レッスンスケジュール',
        payments: '支払い履歴',
        reviews: '先生レビュー',
        reports: '学習レポート',
        messages: 'メッセージ',
        settings: '設定',
      },
      dashboard: {
        welcome: '保護者の方、ようこそ',
        childrenOverview: 'お子様の状況',
        recentActivities: '最近の活動',
        upcomingClasses: '予定のレッスン',
        paymentStatus: '支払い状況',
        teacherReviews: '先生レビュー',
        learningProgress: '学習進捗',
        viewDetails: '詳細を見る',
        noActivities: '活動がありません',
        noClasses: '予定のレッスンがありません',
        noPayments: '支払い履歴がありません',
        noReviews: 'レビューがありません',
      },
      children: {
        title: 'お子様管理',
        childInfo: 'お子様情報',
        name: '名前',
        age: '年齢',
        grade: '学年',
        teacher: '担当先生',
        level: 'レベル',
        progress: '進捗率',
        lastClass: '前回のレッスン',
        nextClass: '次のレッスン',
        noChildren: '登録されたお子様がいません',
      },
      schedule: {
        title: 'レッスンスケジュール',
        thisWeek: '今週',
        nextWeek: '来週',
        classTime: 'レッスン時間',
        teacher: '先生',
        course: 'コース',
        status: '状態',
        completed: '完了',
        scheduled: '予定',
        cancelled: 'キャンセル',
        noClasses: 'レッスンスケジュールがありません',
      },
      payments: {
        title: '支払い履歴',
        paymentDate: '支払い日',
        amount: '金額',
        method: '支払い方法',
        status: '状態',
        description: '説明',
        paid: '支払い完了',
        pending: '保留中',
        failed: '失敗',
        refunded: '返金済み',
        noPayments: '支払い履歴がありません',
      },
      reviews: {
        title: '先生レビュー',
        teacher: '先生',
        rating: '評価',
        comment: 'コメント',
        date: '日付',
        course: 'コース',
        noReviews: 'レビューがありません',
        writeReview: 'レビューを書く',
        submit: '提出',
      },
      reports: {
        title: '学習レポート',
        academicProgress: '学習進捗',
        attendance: '出席率',
        homework: '宿題完了率',
        participation: '参加度',
        improvement: '向上度',
        recommendations: '推奨事項',
        period: '期間',
        thisMonth: '今月',
        lastMonth: '先月',
        thisYear: '今年',
        noData: 'データがありません',
      },
      messages: {
        title: 'メッセージ',
        compose: '作成',
        inbox: '受信トレイ',
        sent: '送信済み',
        draft: '下書き',
        from: '送信者',
        to: '受信者',
        subject: '件名',
        message: 'メッセージ',
        send: '送信',
        reply: '返信',
        forward: '転送',
        delete: '削除',
        noMessages: 'メッセージがありません',
      },
      settings: {
        title: '設定',
        profile: 'プロフィール',
        security: 'セキュリティ',
        notifications: '通知',
        privacy: 'プライバシー',
        billing: '支払い',
        language: '言語',
        korean: '한국어',
        japanese: '日本語',
        saveChanges: '変更を保存',
        changesSaved: '変更が保存されました',
      },
    },
  },
};

export const useTranslation = (language: Language) => {
  return translations[language];
}; 