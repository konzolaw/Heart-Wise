import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function VideoCallsComponent() {
  const [showCreateCall, setShowCreateCall] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);

  const chatRooms = useQuery(api.liveChat.getChatRooms);
  const activeCalls = useQuery(api.videoCalls.getActiveVideoCalls, {});

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📹 Video Calls</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowQuickJoin(true)}
            className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
          >
            Quick Join
          </button>
          <button
            onClick={() => setShowCreateCall(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Start New Call
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Meet Like Google Meet</h3>
        <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
          Start instant video calls or join existing ones. Perfect for fellowship, prayer meetings, and community gatherings.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateCall(true)}
            className="text-sm bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors"
          >
            Start instant meeting
          </button>
          <button
            onClick={() => setShowQuickJoin(true)}
            className="text-sm bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-md border border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            Join with meeting ID
          </button>
        </div>
      </div>

      {/* Active Calls */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Calls</h3>
        <div className="grid gap-4">
          {activeCalls?.map((call) => (
            <VideoCallCard key={call._id} call={call} />
          ))}
          {!activeCalls?.length && (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📹</span>
              </div>
              <p className="text-sm">No active video calls</p>
              <p className="text-xs">Start a new call to connect with the community</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Call Modal */}
      {showCreateCall && (
        <CreateCallModal 
          chatRooms={chatRooms || []}
          onClose={() => setShowCreateCall(false)} 
        />
      )}

      {/* Quick Join Modal */}
      {showQuickJoin && (
        <QuickJoinModal onClose={() => setShowQuickJoin(false)} />
      )}
    </div>
  );
}

function VideoCallCard({ call }: { call: any }) {
  const joinCall = useMutation(api.videoCalls.joinVideoCall);
  const endCall = useMutation(api.videoCalls.endVideoCall);
  const participants = useQuery(api.videoCalls.getCallParticipants, { callId: call._id });

  const handleJoinCall = async () => {
    try {
      const result = await joinCall({ callId: call._id });
      if (result.meetingUrl) {
        window.open(result.meetingUrl, "_blank");
        toast.success(result.alreadyJoined ? "Rejoined call" : "Joined call successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to join call");
    }
  };

  const handleEndCall = async () => {
    if (confirm("Are you sure you want to end this call for everyone?")) {
      try {
        await endCall({ callId: call._id });
        toast.success("Call ended successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to end call");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{call.title}</h4>
          <p className="text-sm text-gray-600 dark:text-slate-400">Hosted by {call.hostName}</p>
          {call.description && (
            <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">{call.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {call.currentParticipants}/{call.maxParticipants} participants
          </p>
        </div>
      </div>

      {/* Participants */}
      {participants && participants.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Participants:</p>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => (
              <div key={participant._id} className="flex items-center space-x-1">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-gray-600 dark:text-slate-400">{participant.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => void handleJoinCall()}
          disabled={call.currentParticipants >= call.maxParticipants}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {call.currentParticipants >= call.maxParticipants ? "Call Full" : "Join Call"}
        </button>
        <button
          onClick={() => void handleEndCall()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          End
        </button>
      </div>
    </div>
  );
}

function CreateCallModal({ chatRooms, onClose }: { chatRooms: any[], onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomId, setRoomId] = useState<Id<"chatRooms"> | "">("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const createCall = useMutation(api.videoCalls.createVideoCall);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !roomId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCall({
        roomId: roomId,
        title: title.trim(),
        description: description.trim() || undefined,
        maxParticipants,
      });

      if (result.meetingUrl) {
        window.open(result.meetingUrl, "_blank");
        toast.success("Call created and opened successfully");
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create call");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start New Video Call</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Call Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
              placeholder="Evening Fellowship Call"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Chat Room *
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value as Id<"chatRooms">)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a chat room</option>
              {chatRooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
              rows={3}
              placeholder="What will you discuss in this call?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Max Participants
            </label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              min="2"
              max="50"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Start Call"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickJoinModal({ onClose }: { onClose: () => void }) {
  const [meetingId, setMeetingId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const joinCall = useMutation(api.videoCalls.joinVideoCall);

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId.trim()) {
      toast.error("Please enter a meeting ID");
      return;
    }

    setIsLoading(true);
    try {
      // For quick join, we'll try to join by meeting ID
      const result = await joinCall({ callId: meetingId.trim() as Id<"videoCalls"> });
      if (result.meetingUrl) {
        window.open(result.meetingUrl, "_blank");
        toast.success("Joined meeting successfully");
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to join meeting. Please check the meeting ID.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Join Meeting</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => void handleQuickJoin(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Meeting ID *
            </label>
            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
              placeholder="Enter meeting ID"
              required
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              You can find the meeting ID in the invitation or active calls list
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Joining..." : "Join Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
