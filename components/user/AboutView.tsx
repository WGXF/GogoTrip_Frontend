import React, { useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { User } from '@/types';
import VincentImg from '@/icon/about/Vincent/Vincent.svg';
import YuanKaiImg from '@/icon/about/YuanKai/YuanKai.svg';
import UjinImg from '@/icon/about/Ujin/Ujin.svg';

interface AboutViewProps {
  user: User;
}

type MemberView = 'list' | 'vincent' | 'yuankai' | 'ujin';

const AboutView: React.FC<AboutViewProps> = ({ user }) => {
  const [currentView, setCurrentView] = useState<MemberView>('list');

  const teamMembers = [
    {
      id: 'vincent' as const,
      name: 'Vincent Yeow Zhi Yuan',
      role: 'FYP Project Member',
      responsibility: 'Admin Site',
      image: VincentImg,
      introduction: 'Vincent Yeow Zhi Yuan is a student from Multimedia University, currently pursuing a Diploma in Faculty of Information Technology. In the FYP project, Vincent is responsible for the Admin Site, focusing on system management features and ensuring smooth administrative operations.',
      responsibilities: [
        'Admin site development',
        'Administrative feature implementation',
        'System management support'
      ]
    },
    {
      id: 'ujin' as const,
      name: 'Ujin Tan Choo Yee',
      role: 'FYP Project Leader',
      responsibility: 'Info Site',
      image: UjinImg,
      introduction: 'Ujin Tan Choo Yee is a Diploma in Faculty of Information Technology student at Multimedia University and serves as the Project Leader of the FYP project. Ujin is primarily responsible for the Info Site, overseeing content structure and overall presentation to ensure clear and effective information delivery.',
      responsibilities: [
        'Project leadership and coordination',
        'Info site development',
        'Content structure and presentation management'
      ]
    },
    {
      id: 'yuankai' as const,
      name: 'Toh Yuan Kai',
      role: 'FYP Project Member',
      responsibility: 'Back-end system and User Site',
      image: YuanKaiImg,
      introduction: 'Toh Yuan Kai is a student from Multimedia University, pursuing a Diploma in Faculty of Information Technology. In this FYP project, Yuan Kai is responsible for the Back-end system and the User Site, focusing on system logic, data handling, and user-facing functionality.',
      responsibilities: [
        'Back-end development',
        'User site development',
        'System logic and data management'
      ]
    },
  ];

  const currentMember = teamMembers.find(m => m.id === currentView);

  if (currentView !== 'list' && currentMember) {
    return (
      <div className="flex h-screen relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-12">
            {/* Back Button */}
            <button
              onClick={() => setCurrentView('list')}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 mb-16 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Team</span>
            </button>

            {/* Profile Hero - Clean & Centered */}
            <div className="text-center mb-24">
              <div className="w-36 h-36 mx-auto mb-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-4 border-blue-500 shadow-lg">
                <img
                  src={currentMember.image}
                  alt={currentMember.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                {currentMember.name}
              </h1>
              <p className="text-xl text-blue-600 dark:text-blue-400 font-semibold mb-3">
                {currentMember.role}
              </p>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                {currentMember.responsibility}
              </p>
            </div>

            {/* About Section - Spacious & Readable */}
            <div className="mb-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">About</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-12 max-w-2xl">
                {currentMember.introduction}
              </p>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Key Responsibilities</h3>
              <ul className="space-y-4 max-w-2xl">
                {currentMember.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-600 dark:text-blue-400 mt-1.5 text-xl">•</span>
                    <span className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Personal Information - Clean List */}
            <div className="mb-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Background</h2>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">University</p>
                  <p className="text-lg text-slate-900 dark:text-white">Multimedia University</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">Course</p>
                  <p className="text-lg text-slate-900 dark:text-white">Diploma in Faculty of Information Technology</p>
                </div>
              </div>
            </div>

            {/* FYP Supervisor Section - Lighter Card */}
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-3xl p-8 border border-blue-100/50 dark:border-blue-900/20 mb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">FYP Supervisor</h2>
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mr. Pau Kiu Nai</h3>
                  <p className="text-slate-600 dark:text-slate-300">Multimedia University</p>
                </div>
                <a
                  href="https://mmuexpert.mmu.edu.my/knpau"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  Visit Supervisor Profile
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Team List View
  return (
    <div className="flex h-screen relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Meet Our <span className="text-blue-600 dark:text-blue-400">Team</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We are a dedicated team of students from Multimedia University working on the GogoTrip Final Year Project.
              Click on each member to learn more about their role and responsibilities.
            </p>
          </div>

          {/* Team Members Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => setCurrentView(member.id)}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-slate-800/50 transition-all border border-slate-100 dark:border-slate-700/50 p-8 cursor-pointer hover:scale-105 transform duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-40 h-40 mb-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-4 border-blue-500 shadow-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{member.name}</h3>
                <p className="text-blue-600 dark:text-blue-400 font-semibold mb-4">{member.responsibility}</p>
                <button className="px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-900 dark:text-white rounded-xl transition-colors font-medium">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>

          {/* Info Page Link */}
          <div className="text-center">
            <a
              href="https://gogotrip.teocodes.com/info/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              Visit Info Page
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
