import { supabase } from '../supabaseClient';
import { DriverProfile, Ride } from '../types';

export interface SupabaseNotice {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'promo';
}

/**
 * Service to manage Supabase data fetching for Passenger and Driver views
 * with integrated fallback handling to ensure zero UI interruption.
 */
export const supabaseService = {
  /**
   * Fetch registered drivers from Supabase
   */
  async getDrivers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('Drivers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Notice fetching Supabase drivers:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Network issue reaching Supabase drivers:', err);
      return [];
    }
  },

  /**
   * Fetch rides / trips from Supabase
   */
  async getRides(userId?: string, role: 'passenger' | 'driver' = 'passenger'): Promise<any[]> {
    try {
      let query = supabase.from('Rides').select('*').order('created_at', { ascending: false }).limit(30);

      if (userId) {
        const column = role === 'passenger' ? 'passenger_id' : 'driver_id';
        query = query.eq(column, userId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Notice fetching Supabase rides:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Network issue reaching Supabase rides:', err);
      return [];
    }
  },

  /**
   * Fetch driver earnings summary from Supabase
   */
  async getDriverEarnings(driverId?: string): Promise<{
    totalEarningsDZD: number;
    completedTripsCount: number;
    rating: number;
  } | null> {
    try {
      if (!driverId) return null;
      const { data, error } = await supabase
        .from('Rides')
        .select('final_price, driver_earning, status')
        .eq('driver_id', driverId)
        .eq('status', 'completed');

      if (error || !data) {
        return null;
      }

      const totalEarningsDZD = data.reduce(
        (sum, item) => sum + (item.driver_earning || Math.round((item.final_price || 0) * 0.85)),
        0
      );

      return {
        totalEarningsDZD,
        completedTripsCount: data.length,
        rating: 5.0,
      };
    } catch (err) {
      return null;
    }
  },

  /**
   * Check connection status to Supabase
   */
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('Drivers').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
};
