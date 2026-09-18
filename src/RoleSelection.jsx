import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
// تأكد من استيراد متغير db الخاص بقاعدة بيانات فايرستور من ملف إعدادات فيرباس لديك
import { db } from './firebaseConfig'; 

export default function RoleSelection({ user, onComplete }) {
  const [loading, setLoading] = useState(false);

  const selectRole = async (role) => {
    setLoading(true);
    try {
      // حفظ بيانات المستخدم ودوره (passenger أو driver) في مجموعة users بالـ UID الخاص به
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "مستخدم جديد",
        email: user.email || "",
        userType: role, // "passenger" أو "driver"
        createdAt: new Date()
      }, { merge: true });

      setLoading(false);
      // الانتقال للواجهة الرئيسية بعد الحفظ
      if (onComplete) onComplete(role);

    } catch (error) {
      console.error("خطأ أثناء حفظ الدور:", error);
      setLoading(false);
      alert("حدث خطأ، يجدر المحاولة مجدداً.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>مرحباً بك! 👋</h2>
        <p>كيف تريد استخدام التطبيق؟</p>
        
        <button 
          style={{ ...styles.button, backgroundColor: '#007bff' }} 
          onClick={() => selectRole('passenger')}
          disabled={loading}
        >
          🚶‍♂️ نحب نركب (راكب)
        </button>

        <button 
          style={{ ...styles.button, backgroundColor: '#28a745' }} 
          onClick={() => selectRole('driver')}
          disabled={loading}
        >
          🏍️ عندي دراجة نارية (سائق)
        </button>

        {loading && <p style={{marginTop: '10px'}}>جاري الحفظ...</p>}
      </div>
    </div>
  );
}

// تصميم بسيط للتنسيق (CSS-in-JS)
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f4f4f9',
    direction: 'rtl'
  },
  card: {
    padding: '30px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    width: '90%',
    maxWidth: '400px'
  },
  button: {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
