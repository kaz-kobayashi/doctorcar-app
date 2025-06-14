import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/common';
import { Message } from '@/types';
import { config } from '@/config/environment';
import { useAuthStore } from '@/stores';

interface ChatComponentProps {
  caseId: string;
  className?: string;
}

// プリセットメッセージ
const PRESET_MESSAGES = [
  '現場到着しました',
  '患者接触しました',
  '搬送開始します',
  '病院到着しました',
  '処置開始しました',
  '追加支援が必要です'
];

// デモ用メッセージ生成
const generateDemoMessages = (): Message[] => {
  const now = new Date();
  return [
    {
      id: 'msg-1',
      timestamp: {
        toDate: () => new Date(now.getTime() - 15 * 60 * 1000),
        toMillis: () => now.getTime() - 15 * 60 * 1000,
        seconds: Math.floor((now.getTime() - 15 * 60 * 1000) / 1000),
        nanoseconds: 0
      } as any,
      senderId: 'doctor-001',
      senderName: '山田 太郎',
      text: '現場に向かっています。到着予定時刻は10:15です。',
      caseId: '',
      messageType: 'text'
    },
    {
      id: 'msg-2',
      timestamp: {
        toDate: () => new Date(now.getTime() - 10 * 60 * 1000),
        toMillis: () => now.getTime() - 10 * 60 * 1000,
        seconds: Math.floor((now.getTime() - 10 * 60 * 1000) / 1000),
        nanoseconds: 0
      } as any,
      senderId: 'hospital-001',
      senderName: '佐藤 花子',
      text: '了解しました。受け入れ準備を開始します。',
      caseId: '',
      messageType: 'text'
    },
    {
      id: 'msg-3',
      timestamp: {
        toDate: () => new Date(now.getTime() - 5 * 60 * 1000),
        toMillis: () => now.getTime() - 5 * 60 * 1000,
        seconds: Math.floor((now.getTime() - 5 * 60 * 1000) / 1000),
        nanoseconds: 0
      } as any,
      senderId: 'doctor-001',
      senderName: '山田 太郎',
      text: '現場到着しました',
      caseId: '',
      messageType: 'preset'
    }
  ];
};

export const ChatComponent: React.FC<ChatComponentProps> = ({
  caseId,
  className = ''
}) => {
  const { userInfo } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // デモモードの場合、初期メッセージを設定
  useEffect(() => {
    if (config.demoMode) {
      setMessages(generateDemoMessages());
    }
  }, []);

  // 音声認識の初期化
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const speechRecognition = new SpeechRecognition();
      
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'ja-JP';

      speechRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(transcript);
        setIsRecording(false);
      };

      speechRecognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      setRecognition(speechRecognition);
    }
  }, []);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = (text: string, messageType: 'text' | 'preset' = 'text') => {
    if (!text.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      timestamp: {
        toDate: () => new Date(),
        toMillis: () => Date.now(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
      } as any,
      senderId: userInfo?.uid || 'demo-user',
      senderName: userInfo?.name || 'デモユーザー',
      text: text.trim(),
      caseId,
      messageType
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setShowPresets(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const startRecording = () => {
    if (recognition && !isRecording) {
      setIsRecording(true);
      recognition.start();
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            メッセージがありません
          </p>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === userInfo?.uid;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-medical-primary text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {message.senderName} - {formatTime(message.timestamp)}
                  </div>
                  <div className="text-sm break-words">
                    {message.messageType === 'preset' && (
                      <span className="inline-block mr-1">📌</span>
                    )}
                    {message.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* プリセットメッセージ */}
      {showPresets && (
        <div className="mb-2 p-2 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2">定型メッセージ:</div>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_MESSAGES.map((preset) => (
              <button
                key={preset}
                onClick={() => sendMessage(preset, 'preset')}
                className="text-left text-sm px-3 py-2 bg-white border rounded hover:bg-gray-50 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* メッセージ入力エリア */}
      <div className="border-t pt-4">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPresets(!showPresets)}
            className="flex-shrink-0"
          >
            定型
          </Button>
          
          {/* 音声認識ボタン */}
          {recognition && (
            <Button
              size="sm"
              variant={isRecording ? "danger" : "outline"}
              onClick={isRecording ? stopRecording : startRecording}
              className="flex-shrink-0"
              title={isRecording ? '録音停止' : '音声入力'}
            >
              {isRecording ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="7" y="7" width="6" height="6" rx="1" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </Button>
          )}
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? '音声入力中...' : 'メッセージを入力...'}
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary"
            disabled={isRecording}
          />
          <Button
            size="sm"
            onClick={() => sendMessage(newMessage)}
            disabled={!newMessage.trim() || isRecording}
          >
            送信
          </Button>
        </div>
        
        {/* 音声認識の状態表示 */}
        {isRecording && (
          <div className="mt-2 text-xs text-gray-600 flex items-center">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></div>
            音声を認識しています...
          </div>
        )}
        
        {/* 音声認識が利用できない場合の表示 */}
        {!recognition && (
          <div className="mt-2 text-xs text-gray-500">
            ※ このブラウザでは音声認識がサポートされていません
          </div>
        )}
      </div>
    </div>
  );
};