import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Play, 
  Copy, 
  Download, 
  Share2, 
  Code, 
  Save,
  Users,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Settings,
  Palette,
  Terminal
} from 'lucide-react';

interface CodeCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (code: string, language: string, title: string) => void;
  groupId: string;
  currentUser: any;
}

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  cursor: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  color: string;
}

const CodeCanvas: React.FC<CodeCanvasProps> = ({ isOpen, onClose, onSave, groupId, currentUser }) => {
  const [code, setCode] = useState('// Welcome to the collaborative code canvas!\n// Start typing to begin...\n\nfunction hello() {\n  console.log("Hello, World!");\n}\n\nhello();');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('Untitled Canvas');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const languages = [
    { value: 'javascript', label: 'JavaScript', color: '#f7df1e' },
    { value: 'python', label: 'Python', color: '#3776ab' },
    { value: 'html', label: 'HTML', color: '#e34f26' },
    { value: 'css', label: 'CSS', color: '#1572b6' },
    { value: 'json', label: 'JSON', color: '#000000' },
    { value: 'markdown', label: 'Markdown', color: '#083fa1' },
    { value: 'sql', label: 'SQL', color: '#336791' },
    { value: 'bash', label: 'Bash', color: '#4eaa25' },
  ];

  const themes = [
    { value: 'dark', label: 'Dark', bg: 'bg-slate-900', text: 'text-slate-100' },
    { value: 'light', label: 'Light', bg: 'bg-white', text: 'text-slate-900' },
    { value: 'monokai', label: 'Monokai', bg: 'bg-gray-900', text: 'text-green-400' },
    { value: 'github', label: 'GitHub', bg: 'bg-gray-50', text: 'text-gray-800' },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];

  // Simulate collaborative cursors (in a real app, this would come from WebSocket)
  useEffect(() => {
    if (isOpen) {
      const mockCollaborators: Collaborator[] = [
        {
          id: 'user1',
          name: 'Alice',
          avatar: 'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=400',
          cursor: { line: 3, column: 15 },
          color: '#ef4444'
        },
        {
          id: 'user2',
          name: 'Bob',
          cursor: { line: 7, column: 8 },
          color: '#10b981'
        }
      ];
      setCollaborators(mockCollaborators);
    }
  }, [isOpen]);

  const runCode = async () => {
    setIsRunning(true);
    setShowOutput(true);
    
    try {
      // Simulate code execution (in a real app, you'd send this to a secure sandbox)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (language === 'javascript') {
        // Simple JavaScript execution simulation
        let result = '';
        const originalLog = console.log;
        console.log = (...args) => {
          result += args.join(' ') + '\n';
        };
        
        try {
          // eslint-disable-next-line no-eval
          eval(code);
          setOutput(result || 'Code executed successfully (no output)');
        } catch (error) {
          setOutput(`Error: ${error}`);
        } finally {
          console.log = originalLog;
        }
      } else {
        setOutput(`Code execution for ${language} is not implemented in this demo.\n\nYour code:\n${code}`);
      }
    } catch (error) {
      setOutput(`Execution error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    // You could show a toast notification here
  };

  const downloadCode = () => {
    const extension = language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareCanvas = () => {
    // In a real app, this would generate a shareable link
    const shareUrl = `${window.location.origin}/canvas/${groupId}/${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    // Show toast: "Share link copied to clipboard!"
  };

  const saveCanvas = () => {
    onSave(code, language, title);
    // Show toast: "Canvas saved!"
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      runCode();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveCanvas();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent text-white font-semibold text-lg focus:outline-none focus:bg-slate-800 px-2 py-1 rounded"
                placeholder="Canvas Title"
              />
            </div>
            
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {/* Collaborators */}
            <div className="flex items-center space-x-1">
              {collaborators.map(collaborator => (
                <div
                  key={collaborator.id}
                  className="relative group"
                  title={collaborator.name}
                >
                  {collaborator.avatar ? (
                    <img
                      src={collaborator.avatar}
                      alt={collaborator.name}
                      className="w-6 h-6 rounded-full border-2"
                      style={{ borderColor: collaborator.color }}
                    />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: collaborator.color }}
                    >
                      {collaborator.name[0]}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex items-center text-slate-400 text-sm ml-2">
                <Users className="w-4 h-4 mr-1" />
                {collaborators.length + 1}
              </div>
            </div>

            <div className="w-px h-6 bg-slate-600"></div>

            {/* Actions */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowOutput(!showOutput)}
              className={`p-2 rounded-lg transition-colors ${
                showOutput 
                  ? 'text-green-400 bg-green-400/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={showOutput ? 'Hide Output' : 'Show Output'}
            >
              {showOutput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={copyCode}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Copy Code"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={downloadCode}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={shareCanvas}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              title="Run Code (Ctrl+Enter)"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
            
            <button
              onClick={saveCanvas}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              title="Save Canvas (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Theme:</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                >
                  {themes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-300">Font Size:</span>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-slate-400 w-8">{fontSize}px</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full h-full p-4 ${currentTheme.bg} ${currentTheme.text} font-mono resize-none focus:outline-none`}
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
                placeholder="Start typing your code here..."
                spellCheck={false}
              />
              
              {/* Collaborative Cursors */}
              {collaborators.map(collaborator => (
                <div
                  key={collaborator.id}
                  className="absolute pointer-events-none"
                  style={{
                    top: `${collaborator.cursor.line * fontSize * 1.5 + 16}px`,
                    left: `${collaborator.cursor.column * fontSize * 0.6 + 16}px`,
                  }}
                >
                  <div
                    className="w-0.5 h-5 animate-pulse"
                    style={{ backgroundColor: collaborator.color }}
                  ></div>
                  <div
                    className="absolute -top-6 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
                    style={{ backgroundColor: collaborator.color }}
                  >
                    {collaborator.name}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-t border-slate-700 text-sm text-slate-400">
              <div className="flex items-center space-x-4">
                <span>Lines: {code.split('\n').length}</span>
                <span>Characters: {code.length}</span>
                <span className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: languages.find(l => l.value === language)?.color }}
                  ></div>
                  {languages.find(l => l.value === language)?.label}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Ctrl+Enter to run</span>
                <span>•</span>
                <span>Ctrl+S to save</span>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          {showOutput && (
            <div className="w-1/3 border-l border-slate-700 flex flex-col">
              <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-white">Output</span>
                </div>
                <button
                  onClick={() => setOutput('')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div
                ref={outputRef}
                className="flex-1 p-4 bg-slate-900 text-slate-300 font-mono text-sm overflow-auto whitespace-pre-wrap"
              >
                {output || 'No output yet. Run your code to see results here.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeCanvas;