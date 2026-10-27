import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Play,
  Heart,
  Lightbulb,
  ShieldCheck,
  Globe2,
  Users,
  Compass,
  Award,
  Sparkles,
} from 'lucide-react';

export const CompanyInfoPage: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'story' | 'values' | 'leadership' | 'life'>('story');
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const handlePlayVideo = () => {
    setIsPlayingVideo(true);
    addToast('Playing ISS Corporate Keynote', 'info');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-heading">
              About ISS
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#e7d7be]/20 text-[#e7d7be] border border-[#e7d7be]/30">
              COMPANY PORTAL
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Purpose. People. Possibilities.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-emerald-950/60 border border-emerald-900/40">
          <button
            onClick={() => setActiveTab('story')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'story'
                ? 'bg-[#e7d7be] text-[#0a1b14] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Our Story
          </button>
          <button
            onClick={() => setActiveTab('values')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'values'
                ? 'bg-[#e7d7be] text-[#0a1b14] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mission & Values
          </button>
          <button
            onClick={() => setActiveTab('leadership')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'leadership'
                ? 'bg-[#e7d7be] text-[#0a1b14] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Leadership
          </button>
          <button
            onClick={() => setActiveTab('life')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'life'
                ? 'bg-[#e7d7be] text-[#0a1b14] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Life at ISS
          </button>
        </div>
      </div>

      {/* Hero Video Spotlight Banner (Matching Mockup 9) */}
      <div
        className="glass-card relative overflow-hidden rounded-2xl p-8 md:p-12 min-h-[300px] flex flex-col justify-end mb-8 border border-emerald-800/40"
        style={{
          backgroundImage: `url(/assets/images/hero-bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#06110d] via-[#06110d]/80 to-transparent z-0" />

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="brand-iss text-3xl font-extrabold italic">iss</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white font-heading tracking-tight leading-tight mb-3">
            Building a Brighter Tomorrow
          </h2>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed mb-6">
            At ISS, we combine technology, people, and purpose to create a better, more connected world.
          </p>

          <button
            onClick={handlePlayVideo}
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#e7d7be] text-[#0a1b14] font-bold text-xs uppercase tracking-wider hover:bg-[#f3e5ce] transition-all cursor-pointer shadow-lg shadow-black/50"
          >
            <div className="w-6 h-6 rounded-full bg-[#0a1b14] text-[#e7d7be] flex items-center justify-center">
              <Play size={12} fill="#e7d7be" />
            </div>
            <span>Watch Executive Keynote</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'story' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/40 text-emerald-400 flex items-center justify-center mb-4">
              <Compass size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-heading mb-2">Our Origins</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Founded with the bold idea that human potential expands exponentially when powered by intuitive technology and collaborative empathy.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-900/40 text-amber-300 flex items-center justify-center mb-4">
              <Globe2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-heading mb-2">Global Impact</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Serving 45,000+ teams across 34 countries with industry-leading workplace systems, sustainable infrastructure, and intelligent automation.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-10 h-10 rounded-xl bg-teal-900/40 text-teal-300 flex items-center justify-center mb-4">
              <Award size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-heading mb-2">What Drives Us</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every day we create spaces and platforms where teammates thrive, customer friction disappears, and ambitious dreams take flight.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'values' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 border-t-2 border-t-emerald-400">
            <div className="text-emerald-400 mb-3">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">Integrity First</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uncompromising ethics, transparent communication, and genuine accountability in every decision.
            </p>
          </div>

          <div className="glass-card p-6 border-t-2 border-t-amber-300">
            <div className="text-amber-300 mb-3">
              <Lightbulb size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">Bold Innovation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Challenging conventions with smart AI, curiosity-driven experimentation, and fearlessness in solving hard problems.
            </p>
          </div>

          <div className="glass-card p-6 border-t-2 border-t-rose-400">
            <div className="text-rose-400 mb-3">
              <Heart size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">Human Centricity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering diverse perspectives, cultivating psychological safety, and celebrating collective wins.
            </p>
          </div>

          <div className="glass-card p-6 border-t-2 border-t-[#e7d7be]">
            <div className="text-[#e7d7be] mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">Sustainability</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Committing to net-zero environmental footprints, ethical supply chains, and enduring social stewardship.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'leadership' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-xl text-slate-950 mb-4 shadow-md">
              MS
            </div>
            <h3 className="text-base font-bold text-slate-100">Marcus Sterling</h3>
            <p className="text-xs text-[#e7d7be] mt-0.5">Chief Executive Officer</p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Guiding global strategy and culture across 30+ regional headquarters with a focus on human potential and digital transformation.
            </p>
          </div>

          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center font-bold text-xl text-slate-950 mb-4 shadow-md">
              ER
            </div>
            <h3 className="text-base font-bold text-slate-100">Elena Rostova</h3>
            <p className="text-xs text-[#e7d7be] mt-0.5">VP of Engineering</p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Pioneering our scalable cloud infrastructure, machine intelligence integrations, and developer experience platforms.
            </p>
          </div>

          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-300 flex items-center justify-center font-bold text-xl text-slate-950 mb-4 shadow-md">
              SJ
            </div>
            <h3 className="text-base font-bold text-slate-100">Sarah Jenkins</h3>
            <p className="text-xs text-[#e7d7be] mt-0.5">Head of People & Culture</p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Championing our new joiner induction, continuous learning programs, employee wellness, and inclusive team environments.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'life' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <span className="text-[#e7d7be]">🌿</span>
              <span>Wellness & Flexibility</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Flexible hybrid work routines, dedicated mental health days, $600 annual wellness stipends, and ergonomic workspace allowances.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <span className="text-[#e7d7be]">📚</span>
              <span>Growth & Learning Stipend</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              $1,500 annual learning stipend for tech conferences, professional certifications, books, and university executive masterclasses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
