import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight, Building2, Compass, Globe2, Heart,
  Lightbulb, Play, ShieldCheck, Sparkles, Target, UsersRound,
} from 'lucide-react';

type CompanyTab = 'story' | 'values' | 'leadership' | 'life';

const tabs: { id: CompanyTab; label: string }[] = [
  { id: 'story', label: 'Our Story' },
  { id: 'values', label: 'Mission & Values' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'life', label: 'Life at ISS' },
];

export const CompanyInfoPage: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<CompanyTab>('story');

  const playKeynote = () => addToast('Playing ISS Corporate Keynote', 'info');

  return (
    <div className="page-container company-page">
      <div className="company-page-heading">
        <div>
          <div className="company-breadcrumb">HR Admin <span>/</span> Analytics <span>/</span> <b>About ISS</b></div>
          <div className="company-title-row"><h1>About ISS</h1><span>COMPANY PORTAL</span></div>
          <p>Purpose. People. Possibilities.</p>
        </div>
      </div>

      <div className="company-tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'story' ? (
        <StoryView onPlay={playKeynote} />
      ) : activeTab === 'values' ? (
        <ValuesView />
      ) : activeTab === 'leadership' ? (
        <LeadershipView />
      ) : (
        <LifeView />
      )}
    </div>
  );
};

const StoryView: React.FC<{ onPlay: () => void }> = ({ onPlay }) => (
  <>
    <section className="company-hero glass-card">
      <div className="company-hero-copy">
        <small>OUR STORY</small>
        <h2>Building a Brighter Tomorrow</h2>
        <p>At ISS, we combine technology, people, and purpose to create a more connected and sustainable world.</p>
        <div className="company-video-row">
          <button onClick={onPlay}><span><Play size={12} fill="currentColor" /></span> Watch Executive Keynote</button>
          <em>2:36 min</em>
        </div>
      </div>
    </section>

    <div className="company-story-cards">
      <StoryCard icon={<Compass />} tone="green" title="Our Origins" text="Founded with the bold idea that human potential expands exponentially when powered by intuitive technology and collaborative empathy." />
      <StoryCard icon={<Globe2 />} tone="gold" title="Global Impact" text="Serving 45,000+ teams across 34 countries with industry-leading workplace systems, sustainable infrastructure, and intelligent automation." />
      <StoryCard icon={<UsersRound />} tone="green" title="What Drives Us" text="Every day we create spaces and platforms where teammates thrive, customer friction disappears, and ambitious dreams take flight." />
    </div>

    <div className="company-stats glass-card">
      <Stat icon={<UsersRound />} value="45,000+" label="Employees worldwide" />
      <Stat icon={<Building2 />} value="34" label="Countries" />
      <Stat icon={<Sparkles />} value="20+" label="Years of innovation" />
      <Stat icon={<Compass />} value="100%" label="Committed to a sustainable future" />
    </div>

    <div className="company-bottom-grid">
      <section className="company-mission glass-card">
        <div className="company-section-icon green"><Target /></div>
        <h3>Our Mission</h3>
        <p>To empower people and organizations through innovative technology, sustainable practices, and a culture of trust and inclusion.</p>
        <button>Learn more about our mission <ArrowRight size={14} /></button>
      </section>
      <ValuesSummary />
      <LifeSummary />
    </div>
  </>
);

const StoryCard: React.FC<{ icon: React.ReactNode; tone: string; title: string; text: string }> = ({ icon, tone, title, text }) => (
  <section className="company-story-card glass-card">
    <div className={`company-section-icon ${tone}`}>{icon}</div>
    <div><h3>{title}</h3><p>{text}</p></div>
    <ArrowRight size={15} />
  </section>
);

const Stat: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="company-stat"><span className="company-stat-icon">{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>
);

const ValuesSummary: React.FC = () => (
  <section className="company-summary glass-card">
    <h3><ShieldCheck size={18} /> Our Values</h3>
    {['People First', 'Innovation Always', 'Act with Integrity', 'Build for a Better Tomorrow'].map((value, index) => (
      <div className="company-value-row" key={value}><span>{index + 1}</span><div><strong>{value}</strong><small>{['We put people at the center of everything we do.', 'We turn challenges into opportunities.', 'We do what’s right, always.', 'We create lasting impact through responsible growth.'][index]}</small></div><ArrowRight size={13} /></div>
    ))}
  </section>
);

const LifeSummary: React.FC = () => (
  <section className="company-summary company-life-summary glass-card">
    <h3><Heart size={18} /> Life at ISS</h3>
    <p>A culture of curiosity, collaboration, and continuous learning.</p>
    <div className="company-life-images"><div /><div /><div /></div>
    <button>Explore Life at ISS <ArrowRight size={14} /></button>
  </section>
);

const ValuesView: React.FC = () => (
  <div className="company-tab-grid values-view">
    <CompanyTabCard icon={<Target />} title="Our Mission" text="To empower people and organizations through innovative technology, sustainable practices, and a culture of trust and inclusion." />
    <CompanyTabCard icon={<ShieldCheck />} title="Integrity First" text="Uncompromising ethics, transparent communication, and genuine accountability in every decision." />
    <CompanyTabCard icon={<Lightbulb />} title="Bold Innovation" text="Challenging conventions with smart AI, curiosity-driven experimentation, and fearless problem solving." />
    <CompanyTabCard icon={<Heart />} title="Human Centricity" text="Empowering diverse perspectives, cultivating psychological safety, and celebrating collective wins." />
  </div>
);

const LeadershipView: React.FC = () => (
  <div className="company-tab-grid leadership-view">
    {[
      ['MS', 'Marcus Sterling', 'Chief Executive Officer', 'Guiding global strategy and culture across regional headquarters.'],
      ['ER', 'Elena Rostova', 'VP of Engineering', 'Pioneering scalable cloud infrastructure and developer platforms.'],
      ['SJ', 'Sarah Jenkins', 'Head of People & Culture', 'Championing continuous learning and inclusive team environments.'],
    ].map(([initials, name, role, text]) => <div className="company-leader glass-card" key={name}><div>{initials}</div><h3>{name}</h3><b>{role}</b><p>{text}</p></div>)}
  </div>
);

const LifeView: React.FC = () => (
  <div className="company-tab-grid">
    <CompanyTabCard icon={<Heart />} title="Wellness & Flexibility" text="Flexible hybrid work routines, mental health days, wellness stipends, and ergonomic workspace allowances." />
    <CompanyTabCard icon={<Sparkles />} title="Growth & Learning" text="Annual learning support for conferences, professional certifications, books, and executive masterclasses." />
    <CompanyTabCard icon={<UsersRound />} title="Community & Belonging" text="Employee communities, collaborative spaces, and regular opportunities to learn and grow together." />
  </div>
);

const CompanyTabCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <section className="company-tab-card glass-card"><div className="company-section-icon green">{icon}</div><h3>{title}</h3><p>{text}</p></section>
);
