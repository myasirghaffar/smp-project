import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Conversation {
  id: string;
  mission_id: string | null;
  student_id: string;
  client_id: string;
  updated_at: string;
  missions?: { title: string } | null;
  profiles: { full_name: string; avatar_url: string };
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string; avatar_url: string };
}

const Messages = () => {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    const recipientId = location.state?.recipientId;
    if (recipientId && user) {
      createOrFindConversation(recipientId);
    }
  }, [location.state, user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedConversation]);

  const createOrFindConversation = async (recipientId: string) => {
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(student_id.eq.${user?.id},client_id.eq.${recipientId}),and(student_id.eq.${recipientId},client_id.eq.${user?.id})`
        )
        .maybeSingle();

      if (existingConv) {
        setSelectedConversation(existingConv.id);
        navigate("/messages", { replace: true, state: {} });
        return;
      }

      // Determine roles
      const isUserStudent = userRole === "student";
      
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          student_id: isUserStudent ? user?.id : recipientId,
          client_id: isUserStudent ? recipientId : user?.id,
          mission_id: null,
        })
        .select()
        .single();

      if (error) throw error;

      if (newConv) {
        await loadConversations();
        setSelectedConversation(newConv.id);
        navigate("/messages", { replace: true, state: {} });
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Erreur lors de la création de la conversation");
    }
  };

  const loadConversations = async () => {
    try {
      const { data: convsData, error } = await supabase
        .from("conversations")
        .select("id, mission_id, student_id, client_id, updated_at")
        .or(`student_id.eq.${user?.id},client_id.eq.${user?.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch all related data
      const missionIds = convsData?.filter(c => c.mission_id).map(c => c.mission_id) || [];
      const studentIds = convsData?.map(c => c.student_id) || [];
      const clientIds = convsData?.map(c => c.client_id) || [];
      const userIds = [...new Set([...studentIds, ...clientIds])];

      const [missionsResult, profilesResult] = await Promise.all([
        missionIds.length > 0
          ? supabase.from("missions").select("id, title").in("id", missionIds)
          : { data: [] },
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds)
      ]);

      const missionsMap = new Map(missionsResult.data?.map(m => [m.id, m] as [string, any]) || []);
      const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p] as [string, any]) || []);

      const transformedData = (convsData || []).map(item => ({
        ...item,
        missions: item.mission_id ? missionsMap.get(item.mission_id) : null,
        profiles: profilesMap.get(user?.id === item.student_id ? item.client_id : item.student_id)
      }));

      setConversations(transformedData as any);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Erreur lors du chargement des conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", selectedConversation)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const transformedData = (messagesData || []).map(item => ({
        ...item,
        profiles: profilesMap.get(item.sender_id) || { full_name: "Utilisateur", avatar_url: null }
      }));

      setMessages(transformedData as any);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`conversation-${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        async (payload) => {
          const { data: messageData } = await supabase
            .from("messages")
            .select("id, sender_id, content, created_at")
            .eq("id", payload.new.id)
            .single();

          if (messageData) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .eq("id", messageData.sender_id)
              .single();

            const transformed = {
              ...messageData,
              profiles: profileData || { full_name: "Utilisateur", avatar_url: null }
            };
            setMessages((prev) => [...prev, transformed as any]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-12">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="py-12">
        <div className="container">
          <h1 className="text-4xl font-display font-bold mb-8">Messagerie</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Conversations</h2>
              <ScrollArea className="h-[520px]">
                {conversations.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Aucune conversation
                  </p>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedConversation === conv.id
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.profiles?.avatar_url} />
                            <AvatarFallback>
                              {conv.profiles?.full_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {conv.profiles?.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.missions?.title || "Message direct"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>

            {/* Messages Thread */}
            <Card className="md:col-span-2 p-4 flex flex-col">
              {selectedConversation ? (
                <>
                  <ScrollArea className="flex-1 pr-4 mb-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.sender_id === user?.id ? "flex-row-reverse" : ""
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.profiles?.avatar_url} />
                            <AvatarFallback>
                              {message.profiles?.full_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex-1 max-w-[70%] ${
                              message.sender_id === user?.id ? "text-right" : ""
                            }`}
                          >
                            <div
                              className={`inline-block p-3 rounded-lg ${
                                message.sender_id === user?.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(message.created_at), "HH:mm", { locale: fr })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Écrivez votre message..."
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sélectionnez une conversation
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;