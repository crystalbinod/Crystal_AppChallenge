// screens/LoginScreen.tsx
import * as React from 'react';
import { View, Text, Button, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';

export default function LoginScreen() {
   // Get the navigation object with proper typing for RootStackParamList
  // This ensures TypeScript knows 'Details' exists and accepts 'id' as a param
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // State to control GIF visibility
  const [showGif, setShowGif] = React.useState(false);
  
  // Load the Retro Vintage font
  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  

  const handlePress = () => {
    setShowGif(true);  // Show the GIF
    
    // Navigate after GIF plays (adjust time to match your GIF duration)
    setTimeout(() => {
      navigation.navigate('Main');
    }, 900);  // 2 seconds - adjust this to your GIF length
  };

  // Center the content in the screen
  return (
    <View style={{ 
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F2E5D7' 
    }}>
      <Text style={{
        fontSize: 80,
        color: '#C97D60',
        fontFamily: 'Windows', // or custom font name
        marginBottom: 0,
        marginTop: 10,
     }}>title.</Text>
     
     {/* Show GIF when button is pressed, otherwise show pig */}
     {showGif ? (
       <Image 
         source={require('../assets/pig_icon(gif).gif')}  // Replace with your GIF filename
         style={{
           width: 200,
           height: 220,
           marginBottom: 50,
           marginTop: 80,
         }}
       />
     ) : (
       <Image 
         source={require('../assets/pig_icon.png')}
         style={{
           width: 200,
           height: 220,
           marginBottom: 50,
           marginTop: 80,
         }}
       />
     )}
      
      
      <TouchableOpacity //create a button that is an image and puts font over the button
        onPress={handlePress}  // Changed to handlePress
        activeOpacity={0.7}  // Opacity when pressed (0.7 = 70%)
      >
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
          marginBottom: 10,               // Position at top
          alignItems: 'center',   // Center horizontally
          justifyContent: 'center', //Center vertically #C97D60
          color: '#63372C',
          fontSize: 20,
          fontWeight:"bold",
          fontFamily:"Pixel",
        }}>
          LOGIN
        </Text>
      </TouchableOpacity>
      
      
    </View>
  );
}