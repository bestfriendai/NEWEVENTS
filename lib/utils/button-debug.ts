interface ButtonDebugInfo {
  element: HTMLButtonElement
  isDisabled: boolean
  hasClickHandler: boolean
  computedStyles: CSSStyleDeclaration
  eventListeners: string[]
  parentElements: string[]
}

export class ButtonDebugger {
  static analyzeButton(selector: string): ButtonDebugInfo | null {
    const element = document.querySelector(selector) as HTMLButtonElement
    if (!element) {
      console.warn(`Button not found: ${selector}`)
      return null
    }

    const computedStyles = window.getComputedStyle(element)
    const parentElements = []
    let parent = element.parentElement
    while (parent && parentElements.length < 5) {
      parentElements.push(
        `${parent.tagName.toLowerCase()}${parent.className ? "." + parent.className.split(" ").join(".") : ""}`,
      )
      parent = parent.parentElement
    }

    const info: ButtonDebugInfo = {
      element,
      isDisabled: element.disabled || element.hasAttribute("disabled"),
      hasClickHandler: !!(element.onclick || element.addEventListener),
      computedStyles,
      eventListeners: this.getEventListeners(element),
      parentElements,
    }

    console.group(`🔍 Button Debug: ${selector}`)
    console.log("Element:", element)
    console.log("Disabled:", info.isDisabled)
    console.log("Has Click Handler:", info.hasClickHandler)
    console.log("Pointer Events:", computedStyles.pointerEvents)
    console.log("Z-Index:", computedStyles.zIndex)
    console.log("Position:", computedStyles.position)
    console.log("Parent Chain:", parentElements)
    console.log("Event Listeners:", info.eventListeners)
    console.groupEnd()

    return info
  }

  static getEventListeners(element: HTMLElement): string[] {
    // This is a simplified version - in real debugging you might use browser dev tools
    const listeners = []
    if (element.onclick) listeners.push("onclick")
    if (element.onmousedown) listeners.push("onmousedown")
    if (element.onmouseup) listeners.push("onmouseup")
    return listeners
  }

  static testButtonClick(selector: string): void {
    const element = document.querySelector(selector) as HTMLButtonElement
    if (!element) {
      console.error(`Button not found: ${selector}`)
      return
    }

    console.log(`🧪 Testing button click: ${selector}`)

    // Simulate different types of clicks
    const events = [
      new MouseEvent("mousedown", { bubbles: true }),
      new MouseEvent("mouseup", { bubbles: true }),
      new MouseEvent("click", { bubbles: true }),
    ]

    events.forEach((event) => {
      try {
        element.dispatchEvent(event)
        console.log(`✅ ${event.type} event dispatched successfully`)
      } catch (error) {
        console.error(`❌ ${event.type} event failed:`, error)
      }
    })
  }

  static findUnresponsiveButtons(): HTMLButtonElement[] {
    const buttons = Array.from(document.querySelectorAll("button")) as HTMLButtonElement[]
    const unresponsive = buttons.filter((button) => {
      const styles = window.getComputedStyle(button)
      return (
        !button.disabled &&
        styles.pointerEvents !== "none" &&
        !button.onclick &&
        button.getAttribute("type") !== "submit"
      )
    })

    if (unresponsive.length > 0) {
      console.warn("🚨 Found potentially unresponsive buttons:", unresponsive)
    }

    return unresponsive
  }
}

// Global debug functions for development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  ;(window as any).debugButton =
    ButtonDebugger.analyzeButton(window as any).testButtonClick =
    ButtonDebugger.testButtonClick(window as any).findUnresponsiveButtons =
      ButtonDebugger.findUnresponsiveButtons
}
