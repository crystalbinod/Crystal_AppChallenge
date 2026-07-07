import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  ChatMessage,
  getChatResponse,
  getWelcomeMessage,
} from '../lib/chatbot';

type Props = {
  userData?: { [key: string]: any };
};

export default function AIChatBot({ userData }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: getWelcomeMessage(userData),
        },
      ]);
    }
  }, [open, messages.length, userData]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || typing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Small delay so the reply feels like a chatbot is thinking
    await new Promise((resolve) => setTimeout(resolve, 450));

    const reply: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: getChatResponse(trimmed, userData),
    };

    setMessages((prev) => [...prev, reply]);
    setTyping(false);
  };

  return (
    <>
      {!open && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
          accessibilityLabel="Open AI assistant"
        >
          <Text style={styles.fabText}>AI</Text>
        </TouchableOpacity>
      )}

      {open && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.panelWrap}
          pointerEvents="box-none"
        >
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Game Assistant</Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.closeBtn}
                accessibilityLabel="Close chat"
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.bubble,
                    msg.role === 'user' ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      msg.role === 'user' ? styles.userBubbleText : styles.botBubbleText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}

              {typing && (
                <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
                  <ActivityIndicator size="small" color="#63372C" />
                </View>
              )}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask a question..."
                placeholderTextColor="#8a6a5a"
                multiline
                maxLength={300}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || typing) && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!input.trim() || typing}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#63372C',
    borderWidth: 3,
    borderColor: '#C97D60',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#ffd27a',
    fontFamily: 'Pixel',
    fontSize: 16,
    fontWeight: 'bold',
  },
  panelWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 1000,
  },
  panel: {
    width: 300,
    height: 380,
    backgroundColor: '#F2E5D7',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#63372C',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#63372C',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerTitle: {
    color: '#ffd27a',
    fontFamily: 'Pixel',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#ffd27a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messages: {
    flex: 1,
    backgroundColor: '#c78e71',
  },
  messagesContent: {
    padding: 10,
    paddingBottom: 16,
  },
  bubble: {
    maxWidth: '88%',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffb5b5',
    borderColor: '#63372C',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2E5D7',
    borderColor: '#63372C',
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bubbleText: {
    fontFamily: 'Pixel',
    fontSize: 12,
    lineHeight: 18,
  },
  userBubbleText: {
    color: '#63372C',
  },
  botBubbleText: {
    color: '#2d1810',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#F2E5D7',
    borderTopWidth: 2,
    borderTopColor: '#63372C',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 80,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#63372C',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: 'Pixel',
    fontSize: 12,
    color: '#63372C',
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#63372C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#ffd27a',
    fontFamily: 'Pixel',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
