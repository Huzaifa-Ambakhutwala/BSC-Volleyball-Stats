import React from 'react';

const SchedulePage: React.FC = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Match Schedule</h1>
            <div className="w-full h-[800px]">
                <iframe
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRiw02fcdAFEq7yl-C9OwmhpKuTl43-BEdOc4JFUfKSZhGKo7G6r3DHXWlhNV3zYylUGZTIQmCpWWoF/pubhtml?widget=true&amp;headers=false"
                    className="w-full h-full border-0"
                    title="Match Schedule"
                    allowFullScreen
                />
            </div>
        </div>
    );
};

export default SchedulePage; 