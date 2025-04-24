
import React from "react"
import { useState } from "react"


const Tooltip = ({ text, children, position = "top" }) => {
    const [isVisible, setIsVisible] = useState(false)

    const positionClasses = {
        top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
        left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
        right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className={`absolute ${positionClasses[position]} z-10 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md shadow-sm whitespace-nowrap`}
                >
                    {text}
                </div>
            )}
        </div>
    )
}

export default Tooltip

