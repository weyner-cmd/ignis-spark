import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface UserProfile {
    id: string;
    full_name: string;
    role: 'super_admin' | 'matriz_admin' | 'comunidade_lead' | 'fiel';
    tenant_id?: string;
    sub_tenant_id?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    signIn: (email: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log('AuthProvider: Rendering...');
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('AuthProvider: useEffect starting...');
        let isMounted = true;

        const safeSetLoading = (value: boolean) => {
            if (isMounted) setIsLoading(value);
        };

        const loadingTimeout = window.setTimeout(() => {
            console.warn('AuthProvider: session bootstrap timeout, forcing loading=false');
            safeSetLoading(false);
        }, 10000);

        const handleSession = async (nextSession: Session | null, eventLabel?: string) => {
            if (eventLabel) {
                console.log('AuthProvider: Auth state change', eventLabel, nextSession);
            }

            if (!isMounted) return;

            setSession(nextSession);
            setUser(nextSession?.user ?? null);

            if (nextSession?.user) {
                await fetchProfile(nextSession.user.id);
            } else {
                setProfile(null);
            }

            safeSetLoading(false);
        };

        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('AuthProvider: getSession error', error);
                } else {
                    console.log('AuthProvider: Session retrieved', session);
                }

                await handleSession(session);
            } catch (error) {
                console.error('AuthProvider: initSession failed', error);
                safeSetLoading(false);
            }
        };

        void initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            void handleSession(nextSession, _event).catch((error) => {
                console.error('AuthProvider: onAuthStateChange failed', error);
                safeSetLoading(false);
            });
        });

        return () => {
            isMounted = false;
            window.clearTimeout(loadingTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('AuthProvider: fetchProfile error', error);
                return;
            }

            if (data) {
                setProfile(data as UserProfile);
            }
        } catch (error) {
            console.error('AuthProvider: fetchProfile failed', error);
        }
    };

    const signIn = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
    };

    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, isLoading, signIn, signInWithPassword, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
