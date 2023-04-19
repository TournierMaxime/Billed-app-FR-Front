/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import store from "../__mocks__/store.js"
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES } from "../constants/routes.js"
import { ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router.js"
import mockStore from "../__mocks__/store.js";

jest.mock("../app/store", () => mockStore)

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem("user", JSON.stringify({
    "type": "Employee",
    "email": "employee@test.tld",
    "status": "connected"
  }))
})

afterEach(() => {
  jest.clearAllMocks()
})

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      const mailIcon = await screen.findByTestId('icon-mail')
      expect(mailIcon).toHaveClass("active-icon")
    })

    test("Then it should select 'Services en Ligne' from select menu", () => {
      const selectMenu = screen.getByTestId("expense-type")
      userEvent.click(selectMenu)
      const serviceOption = screen.getByText("Services en ligne")
      userEvent.click(serviceOption)
    })

    test("Then it should write 'Nouvelle facture' in name input", async () => {
      const expenseInput = screen.getByTestId("expense-name")
      await userEvent.type(expenseInput, "Nouvelle facture")
      expect(expenseInput).toHaveValue("Nouvelle facture")
    })

    test("Then it should set bill date to '2020-12-15'", async () => {
      const dateInput = screen.getByTestId("datepicker")
      dateInput.value = "2020-12-15"
      expect(dateInput.value).toBe("2020-12-15")
      expect(dateInput).toBeValid()
    })

    test("Then it should set price amount to '300'", async () => {
      const priceInput = screen.getByTestId("amount")
      await userEvent.type(priceInput, "300")
      expect(priceInput.value).toBe("300")
      expect(priceInput).toBeValid()
    })

    test("Then it should set vat to '20'", async () =>  {
      const tvaInput = screen.getByTestId("vat")
      await userEvent.type(tvaInput, "20")
      expect(tvaInput.value).toBe("20")
      expect(tvaInput).toBeValid()
    })

    test("Then it should set pct to '5'", async () => {
      const pctInput = screen.getByTestId("pct")
      await userEvent.type(pctInput, "5")
      expect(pctInput.value).toBe("5")
      expect(pctInput).toBeValid()
    })

    test("Then it should add 'commentary' to commentary textarea", async () => {
      const commentaryTextArea = screen.getByTestId("commentary")
      await userEvent.type(commentaryTextArea ,"this is a comment")
      expect(commentaryTextArea.value).toBe("this is a comment")
      expect(commentaryTextArea).toBeValid()
    })

    describe("When my form is correct and I choose a file with an incorret extension", () => {
      test("Then it should add gif file to input", async () => {
        const fileInput = screen.getByTestId("file")
        const fakeGifFile = new File(['randomGif'], 'test.gif', {type: 'image/gif'})
        userEvent.upload(fileInput, fakeGifFile);
        expect(fileInput.files[0]).toBe(fakeGifFile)
      })

      test("Then form should be invalid", () => {
        const form = screen.getByTestId("form-new-bill")
        expect(form).toBeInvalid()
      })

      describe("When i'm clicking on submit button", () => {
        test("Then it should not send user back to bills page", () => {
          const submitButton = screen.getByText("Envoyer")
          userEvent.click(submitButton)
          expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
        })
      })
    })

    describe("When my form is correct and I choose a file with an correct extension", () => {
      test("Then it should add png file to file input", async () => {
        const fakePngFile = new File(['test'], 'test.png', {type: "image/png"})
        const fileInput = screen.getByTestId("file")
        userEvent.upload(fileInput, fakePngFile)
        expect(fileInput.files[0]).toBe(fakePngFile)
      })

      describe("When i'm clicking on submit button", () => {
        test("Then it should submit form and call store update method without error", () => {
          const storeSpy = jest.spyOn(store.bills(), "update")
          const consoleErrorSpy = jest.spyOn(console, "error")
          const submitButton = screen.getByText("Envoyer")
          userEvent.click(submitButton)
          expect(storeSpy).toHaveBeenCalled()
          expect(consoleErrorSpy).not.toHaveBeenCalled()
        })
  
        test("Then it should send user back to bill page", async () => {
          await screen.findByTestId("btn-new-bill")
        })  
      })
    })

    describe("When i'm submiting valid form and api error occurs", () => {
      beforeEach( async () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        new NewBill({ document, onNavigate, store, localStorageMock })

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.clear()
        window.localStorage.setItem("user", JSON.stringify({
          email: "employee@test.tld"
        }))
  
        await userEvent.type(screen.getByTestId("expense-name"), "Nouvelle facture")
        screen.getByTestId("datepicker").value = "2020-12-15"         
        await userEvent.type(screen.getByTestId("amount"), "300")         
        await userEvent.type(screen.getByTestId("vat"), "20")         
        await userEvent.type(screen.getByTestId("pct"), "5")         
        userEvent.upload(screen.getByTestId("file"), new File(['test'], 'test.jpg', {type: "image/jpg"}))
      })
  
      test("Then console.error should be called with 'Error 401", async () => {
        const submitButton = screen.getByText("Envoyer")
        const authErrorMock = new Error ("Error 401")

        jest.spyOn(store.bills(), "update").mockRejectedValueOnce(authErrorMock)

        const consoleErrorSpy = jest.spyOn(console, "error")
        userEvent.click(submitButton)
        expect(store.bills().update).toHaveBeenCalled()
  
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(authErrorMock)
        })
      })
  
      test("Then console.error should be called with 'Error 404", async () => {
        const submitButton = screen.getByText("Envoyer")
        const authErrorMock = new Error ("Error 404")

        jest.spyOn(store.bills(), "update").mockRejectedValueOnce(authErrorMock)

        const consoleErrorSpy = jest.spyOn(console, "error")
        userEvent.click(submitButton)
        expect(store.bills().update).toHaveBeenCalled()
  
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(authErrorMock)
        })
      })
  
      test("Then console.error should be called with 'Error 500", async () => {
        const submitButton = screen.getByText("Envoyer")
        const authErrorMock = new Error ("Error 500")

        jest.spyOn(store.bills(), "update").mockRejectedValueOnce(authErrorMock)

        const consoleErrorSpy = jest.spyOn(console, "error")
        userEvent.click(submitButton)
        expect(store.bills().update).toHaveBeenCalled()
  
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(authErrorMock)
        })
      })
    })
  })
})