import React from 'react';

const SchedulePage: React.FC = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Match Schedule</h1>
            <div className="w-full h-[800px]">
                <iframe
                    src="https://bit.ly/bsc-1446-tball-live"
                    className="w-full h-full border-0"
                    title="Match Schedule"
                    allowFullScreen
                />
            </div>
        </div>
    );
};

export default SchedulePage; 