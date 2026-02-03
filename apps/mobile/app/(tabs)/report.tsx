import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Report Screen - Report hazard form will be implemented here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});
