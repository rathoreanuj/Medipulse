import React, { useEffect } from "react";
import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { motion } from "framer-motion";

export default function Stats() {
  const { doctors, backendUrl } = useContext(AppContext);
  const [stats, setStats] = useState({
    appointments: 0,
    doctors: 0,
    support: "24/7",
  });

  useEffect(() => {
    // Fetch stats from public endpoint
    const fetchStats = async () => {
      try {
        // Fetch stats from public endpoint (no authentication required)
        const { data } = await axios.get(
          backendUrl + "/api/admin/public-stats"
        );

        if (data.success) {
          setStats({
            appointments: data.stats?.appointments || 0,
            doctors: data.stats?.doctors || doctors?.length || 0,
            support: "24/7",
          });
        } else {
          // Fallback to default values
          setStats({
            appointments: 0,
            doctors: doctors?.length || 0,
            support: "24/7",
          });
        }
      } catch (error) {
        console.log("Error fetching stats:", error);
        // Fallback to available data
        setStats({
          appointments: 0,
          doctors: doctors?.length || 0,
          support: "24/7",
        });
      }
    };

    fetchStats();
  }, [doctors, backendUrl]);
  return (
    <div>
      {/* Stats Section */}
      <div className="py-2">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-md p-8 md:p-12"
          >
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-10">
              Trust the Numbers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Stat 1 - Appointments */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center p-6 rounded-xl"
              >
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-4xl font-bold text-primary mb-2">
                  {stats.appointments.toLocaleString()}+
                </h3>
                <p className="text-gray-600 font-medium">Appointments Served</p>
              </motion.div>

              {/* Stat 2 - Doctors */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center p-6  rounded-xl"
              >
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-4xl font-bold text-green-600 mb-2">
                  {stats.doctors}+
                </h3>
                <p className="text-gray-600 font-medium">Certified Doctors</p>
              </motion.div>

              {/* Stat 3 - Support */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center p-6 rounded-xl"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-4xl font-bold text-blue-700 mb-2">
                  {stats.support}
                </h3>
                <p className="text-gray-600 font-medium">Support Available</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
