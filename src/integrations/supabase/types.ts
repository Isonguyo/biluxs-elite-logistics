export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          body: string | null
          booking_id: string | null
          created_at: string
          driver_id: string | null
          id: string
          kind: string
          metadata: Json
          title: string
        }
        Insert: {
          body?: string | null
          booking_id?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          kind: string
          metadata?: Json
          title: string
        }
        Update: {
          body?: string | null
          booking_id?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          kind?: string
          metadata?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_stats"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "alerts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          after_value: Json | null
          before_value: Json | null
          created_at: string
          detail: string | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          detail?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          detail?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          actions: Json
          created_at: string
          description: string | null
          enabled: boolean
          fire_count: number
          id: string
          last_fired_at: string | null
          name: string
          trigger_field: string
          trigger_operator: string
          trigger_value: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          fire_count?: number
          id?: string
          last_fired_at?: string | null
          name: string
          trigger_field: string
          trigger_operator?: string
          trigger_value: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          fire_count?: number
          id?: string
          last_fired_at?: string | null
          name?: string
          trigger_field?: string
          trigger_operator?: string
          trigger_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          booking_id: string
          created_at: string
          id: string
          note: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          booking_id: string
          created_at?: string
          id?: string
          note: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          addons: Json
          base_price: number
          created_at: string
          distance_km: number
          driver_id: string | null
          driver_lat_lng: Json | null
          dropoff_location: string
          id: string
          luxury_protocol: boolean
          paid_at: string | null
          payment_amount: number | null
          payment_ref: string | null
          payment_status: string
          pickup_location: string
          pickup_time: string
          qr_status: string
          qr_token: string | null
          qr_verified_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
          user_id: string
          vehicle_id: string | null
          waybill_code: string
        }
        Insert: {
          addons?: Json
          base_price?: number
          created_at?: string
          distance_km?: number
          driver_id?: string | null
          driver_lat_lng?: Json | null
          dropoff_location: string
          id?: string
          luxury_protocol?: boolean
          paid_at?: string | null
          payment_amount?: number | null
          payment_ref?: string | null
          payment_status?: string
          pickup_location: string
          pickup_time: string
          qr_status?: string
          qr_token?: string | null
          qr_verified_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
          waybill_code?: string
        }
        Update: {
          addons?: Json
          base_price?: number
          created_at?: string
          distance_km?: number
          driver_id?: string | null
          driver_lat_lng?: Json | null
          dropoff_location?: string
          id?: string
          luxury_protocol?: boolean
          paid_at?: string | null
          payment_amount?: number | null
          payment_ref?: string | null
          payment_status?: string
          pickup_location?: string
          pickup_time?: string
          qr_status?: string
          qr_token?: string | null
          qr_verified_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
          waybill_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_stats"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          audience: string
          body: string
          channel: string
          created_at: string
          id: string
          recipients: number
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
        }
        Insert: {
          audience?: string
          body: string
          channel?: string
          created_at?: string
          id?: string
          recipients?: number
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
        }
        Update: {
          audience?: string
          body?: string
          channel?: string
          created_at?: string
          id?: string
          recipients?: number
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      cargo_shipments: {
        Row: {
          created_at: string
          current_warehouse: string | null
          description: string | null
          destination: string
          estimated_delivery: string | null
          id: string
          origin: string
          proof_of_delivery_url: string | null
          status: string
          tracking_code: string
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          current_warehouse?: string | null
          description?: string | null
          destination: string
          estimated_delivery?: string | null
          id?: string
          origin: string
          proof_of_delivery_url?: string | null
          status?: string
          tracking_code?: string
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          current_warehouse?: string | null
          description?: string | null
          destination?: string
          estimated_delivery?: string | null
          id?: string
          origin?: string
          proof_of_delivery_url?: string | null
          status?: string
          tracking_code?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      cms_blocks: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          key: string
          link_url: string | null
          published: boolean
          section: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          key: string
          link_url?: string | null
          published?: boolean
          section: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          key?: string
          link_url?: string | null
          published?: boolean
          section?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      concierge_requests: {
        Row: {
          created_at: string
          details: string | null
          id: string
          preferred_date: string | null
          service: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          preferred_date?: string | null
          service: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          preferred_date?: string | null
          service?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          read_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          read_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          read_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          booking_id: string | null
          channel: string
          created_at: string
          id: string
          last_message_at: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          last_message_at?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          last_message_at?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_accounts: {
        Row: {
          address: string | null
          approved: boolean
          company_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          approved?: boolean
          company_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          approved?: boolean
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      destinations: {
        Row: {
          available: boolean
          city: string
          country: string
          created_at: string
          featured: boolean
          id: string
          image_url: string | null
          package_name: string | null
          price: number
          summary: string | null
          updated_at: string
        }
        Insert: {
          available?: boolean
          city: string
          country: string
          created_at?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          package_name?: string | null
          price?: number
          summary?: string | null
          updated_at?: string
        }
        Update: {
          available?: boolean
          city?: string
          country?: string
          created_at?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          package_name?: string | null
          price?: number
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_incidents: {
        Row: {
          booking_id: string | null
          created_at: string
          driver_id: string
          id: string
          kind: string
          lat: number | null
          lng: number | null
          note: string | null
          photo_url: string | null
          resolved: boolean
          severity: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          driver_id: string
          id?: string
          kind: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          photo_url?: string | null
          resolved?: boolean
          severity?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          photo_url?: string | null
          resolved?: boolean
          severity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_stats"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "driver_incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          driver_id: string
          id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          driver_id: string
          id?: string
          rating: number
          reviewer_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_reviews_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_stats"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "driver_reviews_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_shifts: {
        Row: {
          created_at: string
          driver_id: string
          ended_at: string | null
          id: string
          started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_shifts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_stats"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "driver_shifts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          availability: string
          created_at: string
          full_name: string
          id: string
          last_seen_at: string | null
          license_no: string | null
          luxury_certified: boolean
          phone: string
          photo_url: string | null
          plate_number: string | null
          rating: number
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
          user_id: string | null
          vehicle_model: string | null
          verified: boolean
          whatsapp: string | null
          years_experience: number
        }
        Insert: {
          availability?: string
          created_at?: string
          full_name: string
          id?: string
          last_seen_at?: string | null
          license_no?: string | null
          luxury_certified?: boolean
          phone: string
          photo_url?: string | null
          plate_number?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_model?: string | null
          verified?: boolean
          whatsapp?: string | null
          years_experience?: number
        }
        Update: {
          availability?: string
          created_at?: string
          full_name?: string
          id?: string
          last_seen_at?: string | null
          license_no?: string | null
          luxury_certified?: boolean
          phone?: string
          photo_url?: string | null
          plate_number?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_model?: string | null
          verified?: boolean
          whatsapp?: string | null
          years_experience?: number
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          category: string
          description: string | null
          enabled: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          category?: string
          description?: string | null
          enabled?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          category?: string
          description?: string | null
          enabled?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          category: string
          docs_url: string | null
          key: string
          last_checked_at: string | null
          name: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          docs_url?: string | null
          key: string
          last_checked_at?: string | null
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          docs_url?: string | null
          key?: string
          last_checked_at?: string | null
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          kind: string
          manager_id: string | null
          name: string
          region: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          kind?: string
          manager_id?: string | null
          name: string
          region?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          kind?: string
          manager_id?: string | null
          name?: string
          region?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          category: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_end: string | null
          contract_start: string | null
          contract_status: string
          created_at: string
          id: string
          name: string
          notes: string | null
          performance_score: number
          updated_at: string
        }
        Insert: {
          category?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_status?: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          performance_score?: number
          updated_at?: string
        }
        Update: {
          category?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_status?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          performance_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          last4: string | null
          user_id: string
        }
        Insert: {
          brand?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          last4?: string | null
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          last4?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          description: string | null
          key: string
          label: string
        }
        Insert: {
          category?: string
          description?: string | null
          key: string
          label: string
        }
        Update: {
          category?: string
          description?: string | null
          key?: string
          label?: string
        }
        Relationships: []
      }
      platform_roles: {
        Row: {
          created_at: string
          description: string | null
          is_system: boolean
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_system?: boolean
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          is_system?: boolean
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          active: boolean
          category: string
          description: string | null
          key: string
          label: string
          unit: string
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          category?: string
          description?: string | null
          key: string
          label: string
          unit?: string
          updated_at?: string
          value?: number
        }
        Update: {
          active?: boolean
          category?: string
          description?: string | null
          key?: string
          label?: string
          unit?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      procurement_requests: {
        Row: {
          brand: string | null
          created_at: string
          estimated_value: number | null
          id: string
          item_description: string
          notes: string | null
          reference_images: Json
          size: string | null
          source_city: string | null
          status: Database["public"]["Enums"]["procurement_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          item_description: string
          notes?: string | null
          reference_images?: Json
          size?: string | null
          source_city?: string | null
          status?: Database["public"]["Enums"]["procurement_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          item_description?: string
          notes?: string | null
          reference_images?: Json
          size?: string | null
          source_city?: string | null
          status?: Database["public"]["Enums"]["procurement_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          corporate_account_id: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          failed_logins: number
          full_name: string | null
          id: string
          language: string
          last_login_at: string | null
          loyalty_points: number
          loyalty_tier: string
          nationality: string | null
          notification_prefs: Json
          organization_id: string | null
          passport_no: string | null
          phone: string | null
          preferred_airport: string | null
          preferred_vehicle: string | null
          suspended: boolean
          travel_preferences: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          corporate_account_id?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          failed_logins?: number
          full_name?: string | null
          id: string
          language?: string
          last_login_at?: string | null
          loyalty_points?: number
          loyalty_tier?: string
          nationality?: string | null
          notification_prefs?: Json
          organization_id?: string | null
          passport_no?: string | null
          phone?: string | null
          preferred_airport?: string | null
          preferred_vehicle?: string | null
          suspended?: boolean
          travel_preferences?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          corporate_account_id?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          failed_logins?: number
          full_name?: string | null
          id?: string
          language?: string
          last_login_at?: string | null
          loyalty_points?: number
          loyalty_tier?: string
          nationality?: string | null
          notification_prefs?: Json
          organization_id?: string | null
          passport_no?: string | null
          phone?: string | null
          preferred_airport?: string | null
          preferred_vehicle?: string | null
          suspended?: boolean
          travel_preferences?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_key: string
          role_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_key: string
          role_key: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_key?: string
          role_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "platform_roles"
            referencedColumns: ["key"]
          },
        ]
      }
      saved_places: {
        Row: {
          address: string
          created_at: string
          id: string
          kind: string
          label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          kind?: string
          label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          kind?: string
          label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          detail: string | null
          id: string
          ip_address: string | null
          kind: string
          metadata: Json
          resolved: boolean
          severity: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          ip_address?: string | null
          kind: string
          metadata?: Json
          resolved?: boolean
          severity?: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          ip_address?: string | null
          kind?: string
          metadata?: Json
          resolved?: boolean
          severity?: string
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          brand: string | null
          budget: number | null
          created_at: string
          id: string
          item_name: string
          notes: string | null
          order_code: string
          quantity: number
          status: string
          tracking_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          budget?: number | null
          created_at?: string
          id?: string
          item_name: string
          notes?: string | null
          order_code?: string
          quantity?: number
          status?: string
          tracking_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          budget?: number | null
          created_at?: string
          id?: string
          item_name?: string
          notes?: string | null
          order_code?: string
          quantity?: number
          status?: string
          tracking_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tour_bookings: {
        Row: {
          created_at: string
          destination: string
          end_date: string | null
          id: string
          package_name: string
          price: number
          start_date: string | null
          status: string
          travellers: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination: string
          end_date?: string | null
          id?: string
          package_name: string
          price?: number
          start_date?: string | null
          status?: string
          travellers?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          end_date?: string | null
          id?: string
          package_name?: string
          price?: number
          start_date?: string | null
          status?: string
          travellers?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_logs: {
        Row: {
          booking_id: string
          id: string
          latitude: number
          longitude: number
          note: string | null
          recorded_at: string
        }
        Insert: {
          booking_id: string
          id?: string
          latitude: number
          longitude: number
          note?: string | null
          recorded_at?: string
        }
        Update: {
          booking_id?: string
          id?: string
          latitude?: number
          longitude?: number
          note?: string | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_events: {
        Row: {
          actor_id: string | null
          booking_id: string
          created_at: string
          event: string
          id: string
          note: string | null
        }
        Insert: {
          actor_id?: string | null
          booking_id: string
          created_at?: string
          event: string
          id?: string
          note?: string | null
        }
        Update: {
          actor_id?: string | null
          booking_id?: string
          created_at?: string
          event?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          booking_id: string | null
          created_at: string
          file_url: string | null
          id: string
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          kind?: string
          title: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_platform_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_platform_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_platform_roles_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "platform_roles"
            referencedColumns: ["key"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_inspections: {
        Row: {
          checklist: Json
          created_at: string
          driver_id: string
          fuel_level: number | null
          id: string
          mileage: number | null
          notes: string | null
          passed: boolean
        }
        Insert: {
          checklist?: Json
          created_at?: string
          driver_id: string
          fuel_level?: number | null
          id?: string
          mileage?: number | null
          notes?: string | null
          passed?: boolean
        }
        Update: {
          checklist?: Json
          created_at?: string
          driver_id?: string
          fuel_level?: number | null
          id?: string
          mileage?: number | null
          notes?: string | null
          passed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_stats"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "vehicle_inspections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          base_rate: number
          capacity: number
          category: Database["public"]["Enums"]["vehicle_category"]
          created_at: string
          description: string | null
          features: Json
          id: string
          image_url: string | null
          name: string
          per_km_rate: number
          status: Database["public"]["Enums"]["vehicle_status"]
        }
        Insert: {
          base_rate?: number
          capacity?: number
          category: Database["public"]["Enums"]["vehicle_category"]
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          image_url?: string | null
          name: string
          per_km_rate?: number
          status?: Database["public"]["Enums"]["vehicle_status"]
        }
        Update: {
          base_rate?: number
          capacity?: number
          category?: Database["public"]["Enums"]["vehicle_category"]
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          image_url?: string | null
          name?: string
          per_km_rate?: number
          status?: Database["public"]["Enums"]["vehicle_status"]
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      driver_earnings: {
        Row: {
          day: string | null
          distance_km: number | null
          driver_id: string | null
          gross: number | null
          trips: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_stats"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_stats: {
        Row: {
          active_rides: number | null
          avg_rating: number | null
          base_rating: number | null
          completed_rides: number | null
          driver_id: string | null
          full_name: string | null
          phone: string | null
          review_count: number | null
          status: Database["public"]["Enums"]["driver_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_booking_driver: {
        Args: { _booking_id: string }
        Returns: {
          full_name: string
          id: string
          lat_lng: Json
          phone: string
          photo_url: string
          plate_number: string
          rating: number
          status: Database["public"]["Enums"]["driver_status"]
          vehicle_model: string
          verified: boolean
          whatsapp: string
          years_experience: number
        }[]
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_self_driver: { Args: { _driver_id: string }; Returns: boolean }
      scan_booking_qr: { Args: { _qr_token: string }; Returns: Json }
      wallet_topup: {
        Args: { _amount: number; _description?: string; _reference?: string }
        Returns: number
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "corporate_admin"
        | "user"
        | "super_user"
        | "driver"
        | "customer"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      driver_status: "active" | "off_duty" | "suspended"
      procurement_status:
        | "submitted"
        | "sourcing"
        | "shipped"
        | "delivered"
        | "cancelled"
      vehicle_category: "sedan" | "suv" | "bus" | "coach"
      vehicle_status: "available" | "in_use" | "maintenance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "corporate_admin",
        "user",
        "super_user",
        "driver",
        "customer",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      driver_status: ["active", "off_duty", "suspended"],
      procurement_status: [
        "submitted",
        "sourcing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      vehicle_category: ["sedan", "suv", "bus", "coach"],
      vehicle_status: ["available", "in_use", "maintenance"],
    },
  },
} as const
