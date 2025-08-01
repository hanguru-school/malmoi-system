'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  User,
  Mail,
  Phone,
  Clock,
  Palette,
  BookOpen,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  availableServices: string[];
  availableTimeSlots: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  calendarColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  id: string;
  name: string;
}

export default function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: null as File | null,
    availableServices: [] as string[],
    availableTimeSlots: [] as { day: string; startTime: string; endTime: string }[],
    calendarColor: '#3B82F6',
    isActive: true
  });

  // 요일 옵션
  const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];

  // 샘플 데이터 로드
  useEffect(() => {
    const sampleTeachers: Teacher[] = [
      {
        id: '1',
        name: '佐藤先生',
        email: 'sato@hanguru.com',
        phone: '080-1234-5678',
        profileImage: '/images/teacher1.jpg',
        availableServices: ['1', '2'],
        availableTimeSlots: [
          { day: '월', startTime: '09:00', endTime: '18:00' },
          { day: '화', startTime: '09:00', endTime: '18:00' },
          { day: '수', startTime: '09:00', endTime: '18:00' },
          { day: '목', startTime: '09:00', endTime: '18:00' },
          { day: '금', startTime: '09:00', endTime: '18:00' }
        ],
        calendarColor: '#3B82F6',
        isActive: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      },
      {
        id: '2',
        name: '田中先生',
        email: 'tanaka@hanguru.com',
        phone: '080-2345-6789',
        profileImage: '/images/teacher2.jpg',
        availableServices: ['1', '3'],
        availableTimeSlots: [
          { day: '월', startTime: '10:00', endTime: '19:00' },
          { day: '화', startTime: '10:00', endTime: '19:00' },
          { day: '수', startTime: '10:00', endTime: '19:00' },
          { day: '목', startTime: '10:00', endTime: '19:00' },
          { day: '금', startTime: '10:00', endTime: '19:00' }
        ],
        calendarColor: '#10B981',
        isActive: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      }
    ];

    const sampleServices: Service[] = [
      { id: '1', name: '대면 수업 40분' },
      { id: '2', name: '온라인 수업 60분' },
      { id: '3', name: '그룹 수업 90분' }
    ];

    setTeachers(sampleTeachers);
    setServices(sampleServices);
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('profileImage', file);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      availableServices: prev.availableServices.includes(serviceId)
        ? prev.availableServices.filter(id => id !== serviceId)
        : [...prev.availableServices, serviceId]
    }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      availableTimeSlots: [...prev.availableTimeSlots, { day: '월', startTime: '09:00', endTime: '18:00' }]
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availableTimeSlots: prev.availableTimeSlots.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimeSlots: prev.availableTimeSlots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      profileImage: null,
      availableServices: [],
      availableTimeSlots: [],
      calendarColor: '#3B82F6',
      isActive: true
    });
    setEditingTeacher(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 실제 API 호출 대신 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingTeacher) {
        // 수정
        setTeachers(prev => prev.map(teacher => 
          teacher.id === editingTeacher.id 
            ? { 
                ...teacher, 
                ...formData, 
                profileImage: formData.profileImage ? URL.createObjectURL(formData.profileImage) : teacher.profileImage,
                updatedAt: new Date().toISOString() 
              }
            : teacher
        ));
      } else {
        // 추가
        const newTeacher: Teacher = {
          id: Date.now().toString(),
          ...formData,
          profileImage: formData.profileImage ? URL.createObjectURL(formData.profileImage) : '/images/default-teacher.jpg',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTeachers(prev => [...prev, newTeacher]);
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('선생님 저장 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      profileImage: null,
      availableServices: teacher.availableServices,
      availableTimeSlots: teacher.availableTimeSlots,
      calendarColor: teacher.calendarColor,
      isActive: teacher.isActive
    });
    setShowAddModal(true);
  };

  const handleDelete = async (teacherId: string) => {
    if (!confirm('정말로 이 선생님을 삭제하시겠습니까?')) return;

    try {
      // 실제 API 호출 대신 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));
      setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
    } catch (error) {
      console.error('선생님 삭제 실패:', error);
    }
  };

  const toggleTeacherStatus = async (teacherId: string) => {
    try {
      setTeachers(prev => prev.map(teacher => 
        teacher.id === teacherId 
          ? { ...teacher, isActive: !teacher.isActive, updatedAt: new Date().toISOString() }
          : teacher
      ));
    } catch (error) {
      console.error('선생님 상태 변경 실패:', error);
    }
  };

  const getServiceNames = (serviceIds: string[]) => {
    return serviceIds.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">선생님 관리</h1>
          <p className="text-sm text-gray-600">교실에 소속된 선생님 정보를 관리합니다.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>선생님 추가</span>
        </button>
      </div>

      {/* 선생님 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  선생님 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당 서비스
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가능 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {teacher.profileImage ? (
                          <img 
                            src={teacher.profileImage} 
                            alt={teacher.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span>{teacher.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{teacher.phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {getServiceNames(teacher.availableServices)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {teacher.availableTimeSlots.map((slot, index) => (
                        <div key={index} className="text-xs text-gray-600">
                          {slot.day}: {slot.startTime} - {slot.endTime}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleTeacherStatus(teacher.id)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                        teacher.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {teacher.isActive ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>활성</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>비활성</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {editingTeacher ? '선생님 정보 수정' : '새 선생님 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">기본 정보</h4>
                  
                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 佐藤先生"
                    />
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="teacher@hanguru.com"
                    />
                  </div>

                  {/* 전화번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전화번호 *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="080-1234-5678"
                    />
                  </div>

                  {/* 프로필 사진 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로필 사진
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                        {formData.profileImage ? (
                          <img
                            src={URL.createObjectURL(formData.profileImage)}
                            alt="Preview"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="profile-upload"
                        />
                        <label
                          htmlFor="profile-upload"
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>사진 선택</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG 파일만 가능 (최대 2MB)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 서비스 및 설정 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">서비스 및 설정</h4>
                  
                  {/* 담당 가능한 서비스 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      담당 가능한 서비스 *
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {services.map((service) => (
                        <label key={service.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.availableServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{service.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 캘린더 색상 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      캘린더 색상
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.calendarColor}
                        onChange={(e) => handleInputChange('calendarColor', e.target.value)}
                        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">캘린더에서 표시될 색상</span>
                    </div>
                  </div>

                  {/* 활성화 여부 */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">활성화</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      비활성화된 선생님은 예약에서 선택할 수 없습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 가능한 수업 시간대 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">가능한 수업 시간대</h4>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    <Plus className="w-3 h-3" />
                    <span>시간대 추가</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.availableTimeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                      <select
                        value={slot.day}
                        onChange={(e) => updateTimeSlot(index, 'day', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {daysOfWeek.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <span className="text-gray-500">~</span>
                      
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.availableTimeSlots.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      가능한 수업 시간대를 추가해주세요.
                    </div>
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingTeacher ? '수정' : '추가'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 