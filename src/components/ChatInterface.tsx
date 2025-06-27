/* eslint-disable @typescript-eslint/no-misused-promises */
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function ChatInterface() {
  const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState<Id<"conversations"> | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery(api.chat.getUserConversations);
  const messages = useQuery(
    api.chat.getConversationMessages,
    selectedConversation ? { conversationId: selectedConversation } : "skip"
  );

  const createConversation = useMutation(api.chat.createConversation);
  const sendMessage = useMutation(api.chat.sendMessage);
  const renameConversation = useMutation(api.chat.renameConversation);
  const deleteConversation = useMutation(api.chat.deleteConversation);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = async () => {
    try {
      const conversationId = await createConversation({
        title: "New Conversation",
      });
      setSelectedConversation(conversationId);
    } catch (error) {
      toast.error("Failed to create conversation");
    }
  };

  const handleRenameConversation = async (conversationId: Id<"conversations">, title: string) => {
    try {
      await renameConversation({
        conversationId,
        newTitle: title,
      });
      setEditingTitle(null);
      toast.success("Conversation renamed");
    } catch (error) {
      toast.error("Failed to rename conversation");
    }
  };

  const handleDeleteConversation = async (conversationId: Id<"conversations">) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation({ conversationId });
        if (selectedConversation === conversationId) {
          setSelectedConversation(null);
        }
        toast.success("Conversation deleted");
      } catch (error) {
        toast.error("Failed to delete conversation");
      }
    }
  };

  const startEditing = (conversationId: Id<"conversations">, currentTitle: string) => {
    setEditingTitle(conversationId);
    setNewTitle(currentTitle);
  };

  const saveTitle = async (conversationId: Id<"conversations">) => {
    if (newTitle.trim()) {
      await handleRenameConversation(conversationId, newTitle.trim());
    } else {
      setEditingTitle(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);

    try {
      await sendMessage({
        conversationId: selectedConversation,
        content: messageText,
      });
    } catch (error) {
      toast.error("Failed to send message");
      setNewMessage(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[600px]">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-gray-200 dark:border-slate-700 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Conversations</h3>
          <button
            onClick={handleNewConversation}
            className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            New Chat
          </button>
        </div>
        
        <div className="space-y-2">
          {conversations?.map((conversation) => (
            <div
              key={conversation._id}
              className={`rounded-lg transition-colors ${
                selectedConversation === conversation._id
                  ? "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700"
                  : "hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-between p-3">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => setSelectedConversation(conversation._id)}
                >
                  {editingTitle === conversation._id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => saveTitle(conversation._id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void saveTitle(conversation._id);
                        if (e.key === 'Escape') setEditingTitle(null);
                      }}
                      className="w-full text-sm font-medium bg-transparent border-none outline-none text-gray-900 dark:text-white"
                      autoFocus
                    />
                  ) : (
                    <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                      {conversation.title}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {new Date(conversation._creationTime).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(conversation._id, conversation.title);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    title="Rename conversation"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteConversation(conversation._id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {!conversations?.length && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start a new chat to get Biblical guidance</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.isAI ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isAI
                        ? "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.biblicalReferences && message.biblicalReferences.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <p className="text-xs font-medium">Biblical References:</p>
                        <p className="text-xs">{message.biblicalReferences.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask for Biblical relationship advice..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Biblical Counselor</h3>
              <p className="text-gray-600 mb-4">
                Get personalized relationship advice grounded in Biblical wisdom
              </p>
              <button
                onClick={handleNewConversation}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
