// src/components/admin/AdminRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../modules/supabaseClient';
import { logSecurityEvent } from '../../modules/admin/adminService';
import { Loader2 } from 'lucide-react';
import styles from './AdminRoute.module.css';

export const AdminRoute: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // A visitor who is not logged in tried to open /admin
          logSecurityEvent('Unauthenticated Admin Access Blocked', 'warning', {
            target: '/admin',
          });
          if (isMounted) setIsAdmin(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const authorized = profile?.role === 'admin';

        if (!authorized) {
          // A regular (non-admin) user tried to open the admin area
          logSecurityEvent('Unauthorized Role Escalation Attempt', 'critical', {
            target: '/admin',
            userId: user.id,
            userEmail: user.email,
          });
        }

        if (isMounted) setIsAdmin(authorized);
      } catch (err) {
        console.error('Error checking admin status:', err);
        if (isMounted) setIsAdmin(false);
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isAdmin === null) {
    return (
      <div className={styles.loadingScreen}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};