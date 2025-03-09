"use client";

import { useEffect, useState } from "react";
import { getServices } from '@/service/api'

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [services, setServices] = useState<string[]>([]);

  async function handleServices() {
    try {
      const response = await getServices()
      setServices(response.data.tables.map((table) => table.name))
    } catch {

    }
  }

  useEffect(() => {
    handleServices()
  }, []);

  return (
    <>
      <main className="min-h-screen flex  flex-col items-center gap-6 pt-12 p-6">
        {/* <h1 className="font-bold text-3xl">
          <span className="text-blue-dark">#</span>{service}
        </h1> */}

        {services.map((service, i) => {
          return (
            <div
              className="bg-black text-white p-10"
              key={`service-${i}`}
              onClick={() => {
                router.push(encodeURIComponent(service));
              }}
            >
              {service}
            </div>
          );
        })}
      </main>

      <div className="h-[300px] pt-[100px] mt-[-100px] background w-full flex items-center justify-center mix-blend-multiply z-0">
        <a
          href="https://www.instagram.com/andrelmmartins/"
          target="_blank"
          className="flex items-center px-5 h-10 bg-black text-white font-bold rounded-full"
        >
          @andrelmmartins
        </a>
      </div>
    </>
  );
}
