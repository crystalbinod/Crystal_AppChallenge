import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  ChatMessage,
  getChatResponse,
  getWelcomeMessage,
  getNextDayNudgeMessage,
} from '../lib/chatbot';
import { askGemini, hasGeminiApiKey } from '../lib/gemini';
import { hasWorkActivity } from '../lib/workActivity';
import SpeakButton from './SpeakButton';

type Props = {
  userData?: { [key: string]: any };
  enableNextDayReminders?: boolean;
};

const NEXT_DAY_REMINDER_MS = 2 * 60 * 1000;

export default function AIChatBot({ userData, enableNextDayReminders = true }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const panelHeight = isLandscape ? Math.min(220, height - 40) : 380;
  const panelWidth = isLandscape ? Math.min(280, width * 0.4) : 300;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const nudgeHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enableNextDayReminders) return undefined;

    const showNudge = () => {
      if (open || !hasWorkActivity()) return;
      setNudgeVisible(true);
      if (nudgeHideTimer.current) clearTimeout(nudgeHideTimer.current);
      nudgeHideTimer.current = setTimeout(() => setNudgeVisible(false), 12000);
    };

    const interval = setInterval(showNudge, NEXT_DAY_REMINDER_MS);
    return () => {
      clearInterval(interval);
      if (nudgeHideTimer.current) clearTimeout(nudgeHideTimer.current);
    };
  }, [enableNextDayReminders, open]);

  useEffect(() => {
    if (open) setNudgeVisible(false);
  }, [open]);

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

    const history = messages
      .filter((message) => message.id !== 'welcome')
      .map(({ role, text }) => ({ role, text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      let replyText: string;

      if (hasGeminiApiKey()) {
        replyText = await askGemini(userData, history, trimmed);
      } else {
        replyText = getChatResponse(trimmed, userData);
      }

      const reply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: replyText,
      };

      setMessages((prev) => [...prev, reply]);
    } catch (error: any) {
      const fallback = getChatResponse(trimmed, userData);
      const reply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: hasGeminiApiKey()
          ? `I couldn't reach Gemini right now, so here's a quick answer:\n\n${fallback}`
          : fallback,
      };
      setMessages((prev) => [...prev, reply]);
      console.warn('Chatbot reply failed', error?.message || error);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {!open && (
        <>
          {nudgeVisible && enableNextDayReminders ? (
            <TouchableOpacity
              style={[styles.nudgeBubble, isLandscape && styles.nudgeBubbleLandscape]}
              onPress={() => setNudgeVisible(false)}
              activeOpacity={0.9}
            >
              <Text style={styles.nudgeText}>{getNextDayNudgeMessage()}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
          style={[styles.fab, isLandscape && styles.fabLandscape]}
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
          accessibilityLabel="Open Piggy assistant"
        >
          <View style={[styles.fabBubble, isLandscape && styles.fabBubbleLandscape]}>
            <Image
              source={require('../assets/pig_icon.png')}
              style={[styles.fabImage, isLandscape && styles.fabImageLandscape]}
              resizeMode="contain"
            />
          </View>
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>...</Text>
          </View>
        </TouchableOpacity>
        </>
      )}

      {open && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.panelWrap, isLandscape && styles.panelWrapLandscape]}
          pointerEvents="box-none"
        >
          <View style={[styles.panel, { width: panelWidth, height: panelHeight }]}>
            <View style={[styles.header, isLandscape && styles.headerLandscape]}>
              <View style={styles.headerLeft}>
                <Image
                  source={require('../assets/pig_icon.png')}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
                <Text style={styles.headerTitle}>Piggy</Text>
              </View>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={[styles.closeBtn, isLandscape && styles.closeBtnLandscape]}
                accessibilityLabel="Close chat"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                  {msg.role === 'assistant' && (
                    <SpeakButton text={msg.text} compact variant="dark" />
                  )}
                </View>
              ))}

              {typing && (
                <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
                  <ActivityIndicator size="small" color="#63372C" />
                  <Text style={styles.typingText}>Piggy is thinking...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask Piggy anything..."
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
    width: 64,
    height: 64,
    zIndex: 1000,
    elevation: 6,
  },
  fabLandscape: {
    right: 10,
    bottom: 10,
    width: 52,
    height: 52,
  },
  nudgeBubble: {
    position: 'absolute',
    right: 12,
    bottom: 92,
    maxWidth: 240,
    backgroundColor: '#fff8f3',
    borderWidth: 3,
    borderColor: '#63372C',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 999,
    elevation: 5,
  },
  nudgeBubbleLandscape: {
    bottom: 72,
    maxWidth: 220,
  },
  nudgeText: {
    fontFamily: 'LazyDaze',
    fontSize: 13,
    lineHeight: 18,
    color: '#63372C',
  },
  fabBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffd27a',
    borderWidth: 3,
    borderColor: '#63372C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabBubbleLandscape: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  fabImage: {
    width: 46,
    height: 46,
  },
  fabImageLandscape: {
    width: 36,
    height: 36,
  },
  chatBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffb5b5',
    borderWidth: 2,
    borderColor: '#63372C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chatBadgeText: {
    color: '#63372C',
    fontFamily: 'Pixel',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -2,
  },
  panelWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 1000,
  },
  panelWrapLandscape: {
    bottom: 8,
    right: 8,
  },
  panel: {
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
  headerLandscape: {
    paddingVertical: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  headerTitle: {
    color: '#ffd27a',
    fontFamily: 'Windows',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnLandscape: {
    padding: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  typingText: {
    fontFamily: 'LazyDaze',
    fontSize: 13,
    color: '#63372C',
  },
  bubbleText: {
    fontFamily: 'LazyDaze',
    fontSize: 14,
    lineHeight: 21,
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
    fontFamily: 'LazyDaze',
    fontSize: 14,
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
    fontFamily: 'Windows',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
