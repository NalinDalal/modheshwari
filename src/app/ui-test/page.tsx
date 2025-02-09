"use client";
import { Button } from "@/components/ui/Button";
import { SmoothButton } from "@/components/ui/SmoothButton";
import {Sidebar} from "@/components/ui/Sidebar";

export default function Page() {
  return (
    <div>
      UI Testing page, will made only for dev purpose to test out components
      <div>
                button 1->
        <Button>Hellow</Button>
                <br/>
                button-2->
        <SmoothButton
          label="Click Me"
          onClick={() => alert("Button Clicked!")}
        />
        <br/>
                Sidebar->
                <Sidebar />
      </div>
    </div>
  );
}
