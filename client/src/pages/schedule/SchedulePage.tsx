import React from "react";

const SchedulePage: React.FC = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Match Schedule</h1>
            <div className="w-full h-[1000px]">
                <iframe
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRvYbo3k0dZTNiHKfuXcsC-Eba7NbI9tIPhuyFlqfW8MXgcbqiG7eOsIshFR0m4MXjdrIx6j7ZQ6hqN/pubhtml?widget=true&amp;headers=false"
                    className="w-full h-full border-0"
                    title="Match Schedule"
                    allowFullScreen
                    width="100px"
                />
            </div>
        </div>
    );
};

export default SchedulePage;
