import React, { useState } from 'react';
import { LANGUAGE_VERSIONS } from '../utils/constants';

const languages = Object.entries(LANGUAGE_VERSIONS); // Get both language and version

const Dropdown = ({ language, handleLanguageChange }) => {
    const [isOpen, setIsOpen] = useState(false);


    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const onSelect = (lan) =>{
        setIsOpen(false)
        handleLanguageChange(lan)
        
    }

    return (
        <div className="relative inline-block text-left">
            <button 
                id="dropdownDefaultButton" 
                onClick={toggleDropdown} 
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" 
                type="button"
            >
                {language} {/* Display selected language and version */}
                <svg 
                    className="w-2.5 h-2.5 ms-3 ml-2" 
                    aria-hidden="true" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 10 6"
                >
                    <path 
                        stroke="currentColor" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="m1 1 4 4 4-4" 
                    />
                </svg>
            </button>
            {isOpen && (
                <div 
                    id="dropdown" 
                    className="z-10 absolute left-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow w-56 dark:bg-gray-700"
                >
                    <ul 
                        className="py-2 text-sm text-gray-700 dark:text-gray-200" 
                        aria-labelledby="dropdownDefaultButton"
                    >
                        {languages.map(([lan, version], index) => (
                            <li 
                                key={index} 
                                onClick={() => onSelect(lan)} 
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
                            >
                                {lan} (v{version}) {/* Display language name and version in dropdown items */}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
