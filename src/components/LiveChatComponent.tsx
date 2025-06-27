import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function LiveChatComponent() {
  const [selectedRoom, setSelectedRoom] = useState<Id<"chatRooms"> | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatRooms = useQuery(api.liveChat.getChatRooms);
  const messages = useQuery(
    api.liveChat.getChatMessages,
    selectedRoom ? { roomId: selectedRoom } : "skip"
  );

  const sendMessage = useMutation(api.liveChat.sendChatMessage);
  const createChatRoom = useMutation(api.liveChat.createChatRoom);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatRooms && chatRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(chatRooms[0]._id);
    }
  }, [chatRooms, selectedRoom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);

    try {
      await sendMessage({
        roomId: selectedRoom,
        content: messageText,
        isAnonymous,
      });
    } catch (_error: any) {
      toast.error("Failed to send message");
      setNewMessage(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    try {
      await createChatRoom({
        name: newRoomName.trim(),
        description: newRoomDescription.trim(),
      });
      
      setNewRoomName("");
      setNewRoomDescription("");
      setShowCreateRoom(false);
      toast.success("Chat room created successfully!");
    } catch (_error: any) {
      toast.error("Failed to create room");
    }
  };

  const selectedRoomData = chatRooms?.find(room => room._id === selectedRoom);

  return (
    <div className="h-[800px] flex bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
      {/* Room Sidebar */}
      <div className="w-1/3 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 border-r border-gray-200 dark:border-slate-700">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">💬 Chat Rooms</h3>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
              title="Create New Room"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
            Connect with fellow believers in real-time discussions
          </p>
        </div>
        
        <div className="overflow-y-auto max-h-[600px]">
          {chatRooms?.map((room) => (
            <button
              key={room._id}
              onClick={() => setSelectedRoom(room._id)}
              className={`w-full text-left p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-purple-100 dark:hover:bg-slate-700 transition-colors ${
                selectedRoom === room._id 
                  ? 'bg-purple-200 dark:bg-slate-600 border-l-4 border-purple-600' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {room.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                    {room.name}
                  </p>
                  {room.description && (
                    <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                      {room.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500 dark:text-slate-500">Active</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
          
          {!chatRooms?.length && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-600 dark:text-slate-400 text-sm mb-3">No chat rooms yet</p>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 text-sm"
              >
                Create First Room
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom && selectedRoomData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold">
                  {selectedRoomData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selectedRoomData.name}</h2>
                  {selectedRoomData.description && (
                    <p className="text-purple-100 text-sm">{selectedRoomData.description}</p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Live</span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-800">
              {messages?.map((message: any) => (
                <div key={message._id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {message.authorName?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {message.authorName || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-500">
                        {new Date(message._creationTime).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 shadow-sm max-w-md">
                      <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-center">
                  <div className="animate-pulse text-gray-500 dark:text-slate-400 text-sm">
                    Sending message...
                  </div>
                </div>
              )}

              {(!messages || messages.length === 0) && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">💬</div>
                  <p className="text-gray-600 dark:text-slate-400 text-lg mb-2">
                    Welcome to {selectedRoomData.name}!
                  </p>
                  <p className="text-gray-500 dark:text-slate-500 text-sm">
                    Start the conversation by sending the first message
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={(e) => void handleSendMessage(e)} className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
              <div className="mb-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                  />
                  <span className="text-gray-700 dark:text-slate-300">Post anonymously</span>
                </label>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isLoading ? '...' : '📤'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-800">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to Live Chat
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                Select a chat room to start connecting with fellow believers
              </p>
              {chatRooms && chatRooms.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  No chat rooms available. Create the first room to get started!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Chat Room</h3>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => void handleCreateRoom(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                  placeholder="Enter room name..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                  rows={3}
                  placeholder="What will this room be about?"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-md"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
