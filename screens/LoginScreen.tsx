// screens/LoginScreen.tsx
// screens/LoginScreen.tsx
import * as React from 'react';
import { View, Text, Button, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showGif, setShowGif] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  const handlePress = () => {
    setShowGif(true);
    setTimeout(() => {
      navigation.navigate('Main');
    }, 900);
  };

  const styles = StyleSheet.create({
    input: {
      height: 40,
      width: 250,
      marginTop: 15,
      marginBottom:10,
      borderWidth: 1.5,
      borderColor: '#C97D60',
      borderRadius: 10,
      paddingHorizontal: 10,
      backgroundColor: '#fff8f3',
      fontFamily: 'Pixel',
      fontSize: 14,
      color: '#63372C',
      textAlign: 'center',
    },
  });

  return (
    <View style={{ 
      flex: 1,
      alignItems: 'center',
      backgroundColor: '#F2E5D7',
    }}>
      <Text style={{
        fontSize: 80,
        color: '#C97D60',
        fontFamily: 'Windows',
        marginBottom: 0,
        marginTop: 10,
      }}>
        title.
      </Text>

      {showGif ? (
        <Image 
          source={require('../assets/pig_icon(gif).gif')}
          style={{
            width: 200,
            height: 220,
            marginBottom: 0,
            marginTop: 10,
          }}
        />
      ) : (
        <Image 
          source={require('../assets/pig_icon.png')}
          style={{
            width: 200,
            height: 220,
            marginBottom: 0,
            marginTop: 10,
          }}
        />
      )}

      {/* New Input Fields Below the Login Button */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#C97D60"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#C97D60"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Image 
          source={require('../assets/button.png')}
          style={{
            width: 200,
            height: 100,
            position: 'absolute',
            alignSelf: 'center',
          }}
        />
        <Text style={{
          paddingTop: 30,
          marginBottom: 10,
          alignItems: 'center',
          justifyContent: 'center',
          color: '#63372C',
          fontSize: 20,
          fontWeight: 'bold',
          fontFamily: 'Pixel',
          textAlign: 'center',
        }}>
          LOGIN
        </Text>
      </TouchableOpacity>

      
    </View>
  );
}
