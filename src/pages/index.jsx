import Layout from "./Layout.jsx";

import Compass from "./Compass";

import Home from "./Home";

import Profile from "./Profile";

import JourneyStages from "./JourneyStages";

import MeditationDetail from "./MeditationDetail";

import PracticeSession from "./PracticeSession";

import Welcome from "./Welcome";

import BeitMidrash from "./BeitMidrash";

import AdminDashboard from "./AdminDashboard";

import Reminders from "./Reminders";

import SimpleNotifications from "./SimpleNotifications";

import NotificationSettings from "./NotificationSettings";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Compass: Compass,
    
    Home: Home,
    
    Profile: Profile,
    
    JourneyStages: JourneyStages,
    
    MeditationDetail: MeditationDetail,
    
    PracticeSession: PracticeSession,
    
    Welcome: Welcome,
    
    BeitMidrash: BeitMidrash,
    
    AdminDashboard: AdminDashboard,
    
    Reminders: Reminders,
    
    SimpleNotifications: SimpleNotifications,
    
    NotificationSettings: NotificationSettings,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Compass />} />
                
                
                <Route path="/Compass" element={<Compass />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/JourneyStages" element={<JourneyStages />} />
                
                <Route path="/MeditationDetail" element={<MeditationDetail />} />
                
                <Route path="/PracticeSession" element={<PracticeSession />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
                <Route path="/BeitMidrash" element={<BeitMidrash />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/Reminders" element={<Reminders />} />
                
                <Route path="/SimpleNotifications" element={<SimpleNotifications />} />
                
                <Route path="/NotificationSettings" element={<NotificationSettings />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}