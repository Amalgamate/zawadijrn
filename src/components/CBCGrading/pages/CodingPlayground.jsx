import React, { useState } from 'react';
import { Play, Settings, Terminal, Code, RotateCcw, Bot, UploadCloud } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const CodingPlayground = () => {
    const { showSuccess } = useNotifications();
    const [activeTab, setActiveTab] = useState('python');
    const [code, setCode] = useState({
        python: 'def greet(name):\n    print(f"Hello, {name}!")\n\ngreet("Student")',
        web: '<html>\n  <body>\n    <h1>Hello World</h1>\n    <script>\n      console.log("Hello from JS");\n    </script>\n  </body>\n</html>',
        robotics: '// Virtual Robot Controller\n\nfunction start() {\n  robot.moveForward(10);\n  robot.turnRight(90);\n  robot.led("green");\n  console.log("Robot routine started");\n}\n\nstart();'
    });
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRun = () => {
        setIsRunning(true);
        setOutput('Running...');

        // Simulate execution delay
        setTimeout(() => {
            if (activeTab === 'python') {
                setOutput(`> Hello, Student!\n> Program exited with code 0.`);
            } else if (activeTab === 'web') {
                setOutput(`> Console: Hello from JS\n> Page rendered successfully.`);
            } else {
                setOutput(`> Robot moving forward 10 steps...\n> Robot turning right 90 degrees...\n> LED set to GREEN.\n> Robot routine completed.`);
            }
            setIsRunning(false);
        }, 800);
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            showSuccess(`Project "${activeTab.toUpperCase()} Assessment" submitted successfully!`);
            setIsSubmitting(false);
        }, 1200);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-purple/10 rounded-lg text-brand-purple">
                        <Terminal size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Coding & Robotics Playground</h1>
                        <p className="text-sm text-gray-500">Practice Python, Web Development, and Virtual Robotics</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
                    >
                        {isSubmitting ? <RotateCcw className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                        Submit to Teacher
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition">
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold shadow-sm"
                    >
                        {isRunning ? (
                            <RotateCcw className="animate-spin" size={18} />
                        ) : (
                            <Play size={18} />
                        )}
                        Run Code
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Editor Panel */}
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50">
                        <button
                            onClick={() => setActiveTab('python')}
                            className={`px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-colors border-r border-gray-100 ${activeTab === 'python'
                                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <Code size={16} />
                            Python 3.0
                        </button>
                        <button
                            onClick={() => setActiveTab('web')}
                            className={`px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-colors border-r border-gray-100 ${activeTab === 'web'
                                ? 'bg-white text-orange-600 border-t-2 border-t-orange-600'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <Code size={16} />
                            HTML / JS
                        </button>
                        <button
                            onClick={() => setActiveTab('robotics')}
                            className={`px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-colors border-r border-gray-100 ${activeTab === 'robotics'
                                ? 'bg-white text-purple-600 border-t-2 border-t-purple-600'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <Bot size={16} />
                            Robotics (Virtual)
                        </button>
                    </div>

                    {/* Code Area */}
                    <div className="flex-1 relative bg-[#1e1e1e]">
                        <textarea
                            value={code[activeTab]}
                            onChange={(e) => setCode({ ...code, [activeTab]: e.target.value })}
                            className="absolute inset-0 w-full h-full bg-transparent text-gray-300 font-mono p-6 resize-none outline-none leading-relaxed"
                            spellCheck="false"
                            style={{ fontSize: '14px', lineHeight: '1.6' }}
                        />
                    </div>
                </div>

                {/* Output Panel */}
                <div className="w-96 flex flex-col bg-[#0f172a] rounded-xl border border-gray-800 shadow-sm overflow-hidden text-white">
                    <div className="px-4 py-3 bg-[#1e293b] border-b border-gray-700 font-mono text-sm font-semibold flex justify-between items-center">
                        <span>{activeTab === 'robotics' ? 'Robot Console LOG' : 'Terminal Output'}</span>
                        <span className="text-xs text-green-400">● Live</span>
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap overflow-auto">
                        {output || <span className="text-gray-600 italic">Code output will appear here...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodingPlayground;
