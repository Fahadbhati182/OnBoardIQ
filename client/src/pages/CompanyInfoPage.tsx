import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight, BookOpen, CalendarDays, Code2, Diamond,
  ExternalLink, FileText, Globe2, HeartHandshake, Lightbulb, Play,
  ShieldCheck, Target, UsersRound,
} from 'lucide-react';

type CompanyTab = 'overview' | 'values' | 'culture' | 'policies' | 'engineering';

const tabs: { id: CompanyTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'values', label: 'Our Purpose & Values' },
  { id: 'culture', label: 'People & Culture' },
  { id: 'policies', label: 'Policies & Guidelines' },
  { id: 'engineering', label: 'Engineering at Northstar' },
];

const values = [
  ['Integrity', 'Be honest, accurate, and transparent.'],
  ['Collaboration', 'Work together and respect different perspectives.'],
  ['Ownership', 'Take responsibility and deliver with accountability.'],
  ['Continuous Learning', 'Grow, adapt, and improve together.'],
];

export const CompanyInfoPage: React.FC = () => {
  const { addToast, setCurrentPage } = useApp();
  const [activeTab, setActiveTab] = useState<CompanyTab>('overview');

  const openDocuments = () => setCurrentPage('documents');

  return (
    <div className="page-container company-page company-overview-page">
      <div className="company-page-heading">
        <div>
          <div className="company-breadcrumb">Company Info <span>/</span> <b>{tabs.find((tab) => tab.id === activeTab)?.label}</b></div>
          <div className="company-title-row"><h1>Northstar Technologies Pvt. Ltd.</h1><span>COMPANY OVERVIEW</span></div>
          <p>Our company, purpose, values, and the policies that guide how we work.</p>
        </div>
      </div>

      <div className="company-tabs" role="tablist" aria-label="Company information">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`company-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="company-tab-panel"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id="company-tab-panel" role="tabpanel" aria-labelledby={`company-tab-${activeTab}`}>
        {activeTab === 'overview' ? (
          <OverviewView onPlay={() => addToast('Playing Northstar Technologies Company Overview', 'info')} onOpenDocuments={openDocuments} onSelectTab={setActiveTab} />
        ) : activeTab === 'values' ? (
          <ValuesView />
        ) : activeTab === 'culture' ? (
          <CultureView />
        ) : activeTab === 'policies' ? (
          <PoliciesView onOpenDocuments={openDocuments} />
        ) : (
          <EngineeringView onOpenDocuments={openDocuments} />
        )}
      </div>
    </div>
  );
};

const OverviewView: React.FC<{
  onPlay: () => void;
  onOpenDocuments: () => void;
  onSelectTab: (tab: CompanyTab) => void;
}> = ({ onPlay, onOpenDocuments, onSelectTab }) => (
  <>
    <section className="company-hero glass-card company-overview-hero">
      <div className="company-hero-copy">
        <small>ABOUT US</small>
        <h2>A Technology Company<br />Building Useful, Dependable Software</h2>
        <p>Northstar Technologies Pvt. Ltd. is a technology company building digital products and business software. We bring people and technology together to make work more connected, helpful, and reliable.</p>
        <div className="company-video-row">
          <button onClick={onPlay}><span><Play size={12} fill="currentColor" /></span> Watch Company Overview</button>
          <em>2:36 min</em>
        </div>
      </div>
    </section>

    <div className="company-story-cards company-overview-highlights">
      <HighlightCard icon={<Target />} tone="green" title="Our Purpose" text="To make useful technology dependable, accessible, and straightforward to use." onClick={() => onSelectTab('values')} />
      <HighlightCard icon={<Diamond />} tone="gold" title="Our Vision" text="To be a trusted technology partner, known for reliable solutions and lasting impact." onClick={() => onSelectTab('values')} />
      <HighlightCard icon={<UsersRound />} tone="green" title="Who We Are" text="A collaborative team of engineers, product builders, customer enablers, and business professionals." onClick={() => onSelectTab('culture')} />
    </div>

    <div className="company-stats glass-card company-overview-stats">
      <Stat icon={<UsersRound />} value="45,000+" label="Employees worldwide" />
      <Stat icon={<Globe2 />} value="34" label="Countries" />
      <Stat icon={<Code2 />} value="Multiple" label="Engineering teams" />
      <Stat icon={<CalendarDays />} value="20+" label="Years of innovation" />
    </div>

    <div className="company-bottom-grid company-overview-bottom">
      <section className="company-summary company-overview-documents glass-card">
        <div className="company-documents-icon"><FileText size={22} /></div>
        <h3>Our Key Documents</h3>
        <p>Our work is guided by clear policies, SOPs, and guidelines, including onboarding, performance, and engineering standards.</p>
        <button onClick={onOpenDocuments}>Explore Documents <ArrowRight size={14} /></button>
      </section>
      <section className="company-summary company-overview-values glass-card">
        <h3><ShieldCheck size={18} /> Our Core Values</h3>
        {values.map(([title, description], index) => (
          <button className="company-value-row" key={title} onClick={() => onSelectTab('values')}>
            <span>{index + 1}</span><div><strong>{title}</strong><small>{description}</small></div><ArrowRight size={13} />
          </button>
        ))}
      </section>
      <section className="company-summary company-overview-engineering glass-card">
        <h3><Code2 size={18} /> Engineering at Northstar</h3>
        <p>We follow defined engineering standards and development guidelines for quality, security, and reliable delivery.</p>
        <div className="company-guideline-links">
          {['Engineering Standards', 'Frontend Guidelines', 'Backend Guidelines'].map((title) => (
            <button key={title} onClick={onOpenDocuments}>{title}<ExternalLink size={12} /></button>
          ))}
        </div>
      </section>
    </div>
  </>
);

const HighlightCard: React.FC<{
  icon: React.ReactNode;
  tone: string;
  title: string;
  text: string;
  onClick: () => void;
}> = ({ icon, tone, title, text, onClick }) => (
  <button className="company-story-card company-highlight-card glass-card" onClick={onClick}>
    <span className={`company-section-icon ${tone}`}>{icon}</span>
    <span className="company-highlight-copy"><strong>{title}</strong><small>{text}</small></span>
    <ArrowRight size={15} />
  </button>
);

const Stat: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="company-stat"><span className="company-stat-icon">{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>
);

const ValuesView: React.FC = () => (
  <div className="company-tab-grid values-view">
    <CompanyTabCard icon={<Target />} title="Our Purpose" text="To make useful technology dependable, accessible, and straightforward to use." />
    <CompanyTabCard icon={<Diamond />} title="Our Vision" text="To be a trusted technology partner, known for reliable solutions and lasting impact." />
    {values.map(([title, description], index) => (
      <CompanyTabCard key={title} icon={<span className="company-value-number">{index + 1}</span>} title={title} text={description} />
    ))}
  </div>
);

const CultureView: React.FC = () => (
  <div className="company-tab-grid">
    <CompanyTabCard icon={<UsersRound />} title="People First" text="We make space for different perspectives and build a welcoming environment where people can do their best work." />
    <CompanyTabCard icon={<HeartHandshake />} title="Work Together" text="Good outcomes come from thoughtful collaboration across disciplines, teams, and customer communities." />
    <CompanyTabCard icon={<Lightbulb />} title="Grow Together" text="We support continuous learning, share knowledge, and make room for people to develop their skills." />
  </div>
);

const PoliciesView: React.FC<{ onOpenDocuments: () => void }> = ({ onOpenDocuments }) => (
  <section className="company-detail-panel glass-card">
    <div className="company-detail-heading"><span className="company-section-icon green"><BookOpen /></span><div><h2>Policies & Guidelines</h2><p>Find the documents that support your work and help us work consistently.</p></div></div>
    <div className="company-guideline-grid">
      {[
        ['Employee Handbook', 'Workplace policies, expectations, and employee resources.'],
        ['Onboarding Guides', 'Practical information to help you get started.'],
        ['Security & Data Handling', 'Guidance for protecting company and customer information.'],
      ].map(([title, description]) => <div className="company-guideline-card" key={title}><FileText size={19} /><strong>{title}</strong><p>{description}</p><button onClick={onOpenDocuments}>Browse documents <ArrowRight size={14} /></button></div>)}
    </div>
  </section>
);

const EngineeringView: React.FC<{ onOpenDocuments: () => void }> = ({ onOpenDocuments }) => (
  <section className="company-detail-panel glass-card">
    <div className="company-detail-heading"><span className="company-section-icon green"><Code2 /></span><div><h2>Engineering at Northstar</h2><p>Shared practices for building secure, dependable, maintainable software.</p></div></div>
    <div className="company-guideline-grid">
      {[
        ['Engineering Standards', 'Principles for code quality, reviews, testing, and reliable delivery.'],
        ['Frontend Guidelines', 'Patterns for accessible, consistent, and maintainable user experiences.'],
        ['Backend Guidelines', 'Guidance for APIs, data access, security, and service reliability.'],
      ].map(([title, description]) => <div className="company-guideline-card" key={title}><Code2 size={19} /><strong>{title}</strong><p>{description}</p><button onClick={onOpenDocuments}>Browse documents <ArrowRight size={14} /></button></div>)}
    </div>
  </section>
);

const CompanyTabCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <section className="company-tab-card glass-card"><div className="company-section-icon green">{icon}</div><h3>{title}</h3><p>{text}</p></section>
);
