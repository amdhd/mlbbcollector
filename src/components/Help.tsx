import React from 'react';
import Image from 'next/image';

const Help: React.FC = () => {
  const steps = [
    {
      id: 1,
      title: "Create Your Profile",
      description: [
        "Click on the 'Profile' tab if not already there",
        "Upload your MLBB profile picture by clicking on the image upload area",
        "Enter your MLBB/TikTok Username (required)",
        "Enter your Player ID for verification",
        "Select your State/Region (required)",
        "Click 'Save Profile' to continue"
      ],
      icon: "👤"
    },
    {
      id: 2,
      title: "Input Your Collection",
      description: [
        "Navigate to the 'Collection' tab",
        "For each skin tier (Supreme, Grand, Exquisite, etc.), enter the number of skins you own",
        "The app automatically calculates your total points and diamond value",
        "Click 'Save Collection' when finished to record your data"
      ],
      icon: "📊"
    },
    {
      id: 3,
      title: "View Your Ranking",
      description: [
        "After saving your collection, you'll be automatically taken to the 'Rankings' tab",
        "At the top, you'll see your current ranking, top percentile position, and total points",
        "Browse the full leaderboard to see how you compare to other collectors",
        "Filter by state/region to see local rankings"
      ],
      icon: "🏆"
    },
    {
      id: 4,
      title: "View Other Profiles",
      description: [
        "In the Rankings tab, click on any user to view their profile details",
        "See their skin collection breakdown and total points",
        "Compare your collection to other top collectors"
      ],
      icon: "👥"
    },
    {
      id: 5,
      title: "Share With Friends",
      description: [
        "Use the 'Share App' button at the bottom of the Profile or Rankings page",
        "Invite friends to join and compare their collections",
        "The more collectors who join, the more accurate the rankings become!"
      ],
      icon: "📱"
    },
    {
      id: 6,
      title: "Get More Diamonds",
      description: [
        "Need more diamonds for your collection?",
        "Click the 'Buy Diamonds' button to visit JollyMax's diamond store",
        "Expand your skin collection and climb the rankings!"
      ],
      icon: "💎"
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 my-4">
      <h2 className="text-2xl font-bold text-orange-400 mb-6">How to Use This App</h2>
      
      <div className="space-y-8">
        {steps.map((step) => (
          <div key={step.id} className="bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="text-3xl mr-3">{step.icon}</div>
              <h3 className="text-xl font-semibold text-orange-300">
                Step {step.id}: {step.title}
              </h3>
            </div>
            
            <ul className="list-disc pl-10 space-y-2">
              {step.description.map((item, index) => (
                <li key={index} className="text-gray-300">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-indigo-900 bg-opacity-30 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-300 mb-2">Tips</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-300">
          <li>Update your collection regularly as you acquire new skins</li>
          <li>The displayed RM and diamond values are estimates based on average prices</li>
          <li>Your rank updates automatically when you save your collection</li>
          <li>Share the app with your MLBB community to see more accurate rankings</li>
        </ul>
      </div>
    </div>
  );
};

export default Help; 