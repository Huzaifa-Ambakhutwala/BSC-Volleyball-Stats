import React from "react";

const SchedulePage: React.FC = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Match Schedule</h1>
            <div className="w-full h-[900px] overflow-hidden">
                <iframe
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRvYbo3k0dZTNiHKfuXcsC-Eba7NbI9tIPhuyFlqfW8MXgcbqiG7eOsIshFR0m4MXjdrIx6j7ZQ6hqN/pubhtml?widget=true&amp;headers=false&amp;chrome=false&amp;gid=0&amp;range=A1:Z50"
                    className="w-full h-full border-0 scale-75 origin-top-left"
                    style={{ 
                        width: '133.33%', 
                        height: '133.33%',
                        transform: 'scale(0.75)',
                        transformOrigin: 'top left'
                    }}
                    title="Match Schedule"
                    allowFullScreen
                />
            </div>
        </div>
    );
};

export default SchedulePage;
