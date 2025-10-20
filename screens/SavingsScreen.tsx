// screens/SavingsScreen.tsx
import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function SavingsScreen() {
  return (
    // Center the content in the screen
    <ScrollView style={{ 
                flex: 1, 
                backgroundColor: '#F2E5D7',
                flexDirection: 'row',
                
              }}>
                
                {/* column 1 */}
                <View style={{ 
            flex: 1, 
            
            backgroundColor: '#F2E5D7',
            marginBottom: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
                  <View style={{
                   backgroundColor:'#63372C',
                   borderRadius:30,
                   padding:20,
                   paddingRight:400,
                   paddingBottom:150,
                   marginLeft:30,
                }}>
                  <Text style={{
                  fontSize: 38,
                  color: '#C97D60',
                  fontFamily: 'Windows',
                  fontWeight:"bold",
                  
                }}>
                  Savings Summary
                </Text>
                </View>
                
                </View>
    
                {/* column 2 */}
                
        </ScrollView>
  );
}